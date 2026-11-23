import {
  LANGUAGES, SEED_ARTISTS, FILM_SEED_ARTISTS, SEED_VERSION, NEW_ARTIST_RATING,
  PA_FEE, PLATFORM_FEE_RATE, ROYALTY_UPFRONT_RATE, MUSIC_GROUPS, roleById,
} from './data';

/* ---------- Formatting ---------- */
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const money = (n) => inr.format(Math.round(n || 0));

export function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export const todayIso = () => isoDate(new Date());
export function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
export function prettyDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
export const availableDates = (a) => (a.availability || []).map(addDays);
export const initials = (name = '') =>
  name.replace(/^The\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

/* ---------- Categories, roles and tag groups ---------- */
export const isFilm = (a) => a.category === 'film';
export const samplesOf = (a) => (isFilm(a) ? a.samples : a.tracks) || [];
export const groupsForArtist = (a) => (isFilm(a) ? roleById(a.role).groups : MUSIC_GROUPS);
export const groupsForFilters = (f) => (f.category === 'film' ? roleById(f.role).groups : MUSIC_GROUPS);
export const roleLabel = (a) => (isFilm(a) ? roleById(a.role).single : a.type === 'Band' ? 'Band' : `${a.type} vocalist`);
export const addonsOf = (a) => (isFilm(a) ? a.addons || roleById(a.role).addons : []);

export function groupOfTag(groups, tag) {
  return groups.find((g) => g.options.includes(tag));
}
export function endorsableTags(a) {
  const groups = groupsForArtist(a).filter((g) => g.endorse);
  const set = new Set();
  for (const s of samplesOf(a)) for (const t of s.tags) if (groups.some((g) => g.options.includes(t))) set.add(t);
  return [...set];
}
export function topEndorsements(a, n = 3, prefer = []) {
  const e = a.endorsements || {};
  return Object.keys(e)
    .filter((k) => e[k] > 0)
    .sort((x, y) => (prefer.includes(y) - prefer.includes(x)) || e[y] - e[x])
    .slice(0, n)
    .map((tag) => ({ tag, count: e[tag] }));
}

/* ---------- Profile strength ---------- */
function samplePoints(s, groups, max) {
  if (!s || !s.title || !s.title.trim()) return 0;
  const tags = s.tags || [];
  // A sample is complete when it is titled and tagged in at least 3 ways
  // (tag groups plus language).
  const covered = groups.filter((g) => tags.some((t) => g.options.includes(t))).length
    + (tags.some((t) => LANGUAGES.includes(t)) ? 1 : 0);
  return Math.round((max * (1 + Math.min(3, covered))) / 4);
}

export function strengthParts(a) {
  const bio = (a.bio || '').trim();
  const langs = (a.languages || []).length;
  const groups = groupsForArtist(a);
  const samples = samplesOf(a);
  const film = isFilm(a);
  const noun = film ? 'Sample' : 'Track';
  return [
    { label: 'Name', max: 10, pts: (a.name || '').trim() ? 10 : 0 },
    { label: film ? 'Role' : 'Artist type', max: 5, pts: (film ? a.role && (!roleById(a.role).genders || a.gender) : a.type) ? 5 : 0 },
    { label: 'City', max: 10, pts: a.city ? 10 : 0 },
    { label: 'Experience', max: 10, pts: a.experience ? 10 : 0 },
    { label: 'Languages (2+)', max: 10, pts: Math.min(10, langs * 5) },
    film
      ? { label: 'Day rate', max: 10, pts: Number(a.rate) > 0 ? 10 : 0 }
      : { label: 'Stage package price', max: 10, pts: Number(a.stagePrice) > 0 ? 10 : 0 },
    film
      ? { label: "What's included", max: 10, pts: (a.packageDetail || '').trim() ? 10 : 0 }
      : { label: 'Studio package price', max: 10, pts: Number(a.studioPrice) > 0 ? 10 : 0 },
    { label: 'Bio (60+ characters)', max: 10, pts: bio.length >= 60 ? 10 : bio ? 5 : 0 },
    { label: `${noun} 1 with tags`, max: 15, pts: samplePoints(samples[0], groups, 15) },
    { label: `${noun} 2 with tags`, max: 10, pts: samplePoints(samples[1], groups, 10) },
  ];
}
export const strength = (a) => strengthParts(a).reduce((s, p) => s + p.pts, 0);

/* ---------- Merit ranking ----------
   score = 40% tag match + 25% tag endorsements + 20% profile strength + 15% rating
   No paid placement affects this order. */
export function priceFor(a, mode) {
  if (isFilm(a)) return Number(a.rate) || 0;
  return Number(mode === 'stage' ? a.stagePrice : a.studioPrice) || 0;
}
export const selectedTags = (f) => groupsForFilters(f).flatMap((g) => f.tags[g.key] || []);

export function rankArtists(artists, f) {
  const film = f.category === 'film';
  const tagWanted = selectedTags(f);
  const wanted = [...tagWanted, ...f.languages];
  const denominator = tagWanted.length + (f.languages.length ? 1 : 0);
  const rows = [];

  for (const a of artists) {
    if (film !== isFilm(a)) continue;
    if (film && a.role !== f.role) continue;
    const price = priceFor(a, f.mode);
    if (!(price > 0)) continue;
    if (f.city !== 'All' && a.city !== f.city) continue;
    if (price > f.budget) continue;
    if (f.types.length && !f.types.includes(film ? a.gender : a.type)) continue;
    if (f.experience.length && !f.experience.includes(a.experience)) continue;
    if (f.languages.length && !(a.languages || []).some((l) => f.languages.includes(l))) continue;
    const samples = samplesOf(a);
    if (!samples.length) continue;
    if (tagWanted.length && !samples.some((s) => s.tags.some((x) => tagWanted.includes(x)))) continue;

    // Contextual sample: the one carrying the most of the selected tags.
    let sample = samples[0];
    let matched = [];
    for (const s of samples) {
      const m = s.tags.filter((x) => wanted.includes(x));
      if (m.length > matched.length) { sample = s; matched = m; }
    }
    const tagHits = matched.filter((x) => tagWanted.includes(x)).length;
    // Language counts as matched when the sample is in that language, or when the sample
    // carries no language at all (crew work), since the artist already speaks it.
    const sampleHasLang = sample.tags.some((x) => LANGUAGES.includes(x));
    const langHit = f.languages.length && (matched.some((x) => f.languages.includes(x)) || !sampleHasLang) ? 1 : 0;
    const tagMatch = denominator ? Math.min(1, (tagHits + langHit) / denominator) : 1;

    const e = a.endorsements || {};
    const endorseTags = tagWanted.length ? tagWanted : Object.keys(e);
    const endorse = endorseTags.reduce((s, t) => s + (e[t] || 0), 0);
    rows.push({ artist: a, price, sample, matched, tagMatch, endorse, strength: strength(a), rating: a.rating ?? NEW_ARTIST_RATING });
  }

  const maxEndorse = Math.max(1, ...rows.map((r) => r.endorse));
  for (const r of rows) {
    r.score = 0.4 * r.tagMatch + 0.25 * (r.endorse / maxEndorse) + 0.2 * (r.strength / 100) + 0.15 * (r.rating / 5);
  }
  rows.sort((x, y) => y.score - x.score || y.strength - x.strength);
  return rows;
}

/* ---------- Pricing ---------- */
export function quote({ artist, mode, pa, deal, days = 1, addons = [] }) {
  if (isFilm(artist)) {
    const d = Math.max(1, Number(days) || 1);
    const base = priceFor(artist);
    const pkg = base * d;
    const extras = addonsOf(artist)
      .filter((x) => addons.includes(x.id))
      .reduce((s, x) => s + x.price * (x.perDay ? d : 1), 0);
    const subtotal = pkg + extras;
    const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
    return { base, pkg, extras, subtotal, fee, total: subtotal + fee };
  }
  const base = priceFor(artist, mode);
  const pkg = mode === 'studio' && deal === 'royalty' ? Math.round(base * ROYALTY_UPFRONT_RATE) : base;
  const extras = mode === 'stage' && pa ? PA_FEE : 0;
  const subtotal = pkg + extras;
  const fee = Math.round(subtotal * PLATFORM_FEE_RATE);
  return { base, pkg, extras, subtotal, fee, total: subtotal + fee };
}

/* ---------- Storage ---------- */
const KEY = 'ruartist:v1';
const allSeeds = () => JSON.parse(JSON.stringify([...SEED_ARTISTS, ...FILM_SEED_ARTISTS]));

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.artists) && Array.isArray(s.bookings)) {
        if ((s.seedVersion || 1) < SEED_VERSION) {
          // Add any sample artists introduced since this visitor's last session.
          const have = new Set(s.artists.map((a) => a.id));
          s.artists = [...s.artists, ...allSeeds().filter((a) => !have.has(a.id))];
          s.seedVersion = SEED_VERSION;
        }
        return s;
      }
    }
  } catch { /* storage unavailable: fall back to seed */ }
  return { artists: allSeeds(), bookings: [], seedVersion: SEED_VERSION };
}
export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
