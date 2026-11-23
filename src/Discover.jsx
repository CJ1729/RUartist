import { useEffect, useMemo, useRef, useState } from 'react';
import * as audio from './audio';
import { CITIES, TYPES, LANGUAGES, EXPERIENCE, BUDGET_MIN, BUDGET_MAX, FILM_ROLES, FILM_GENDERS, roleById } from './data';
import { rankArtists, money, topEndorsements, groupsForFilters, selectedTags, roleLabel } from './logic';
import { Icon, Pill, Avatar, Star, TagBadge } from './ui';
import { SamplePlayer } from './reel';

export const DEFAULT_FILTERS = {
  category: 'music', mode: 'stage', role: FILM_ROLES[0].id, city: 'All', budget: BUDGET_MAX,
  tags: {}, types: [], languages: [], experience: [],
};

const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const HEADLINES = {
  stage: 'Live talent for your party, right around the corner.',
  studio: 'Find the right voice for your next song.',
  'Character Artist': 'Cast character artists near your shoot.',
  Editor: 'Find an editor who cuts the way you think.',
  Cinematographer: 'Book a cinematographer with the look you want.',
};

function FilterGroup({ title, options, value, onChange }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-extrabold">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Pill key={o} size="sm" active={value.includes(o)} onClick={() => onChange(toggleIn(value, o))}>{o}</Pill>
        ))}
      </div>
    </fieldset>
  );
}

function Segment({ active, onClick, icon, title, sub }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick}
      className={`flex min-h-14 items-center gap-3 rounded-2xl px-3 text-left transition-colors ${active ? 'bg-accent-soft text-accent-dark' : 'text-ink hover:bg-surface'}`}>
      <Icon name={icon} size={22} className="shrink-0" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[15px] font-extrabold">{title}</span>
        {sub && <span className="text-xs font-semibold text-muted">{sub}</span>}
      </span>
    </button>
  );
}

export default function Discover({ artists, filters, setFilters, onOpen }) {
  const [showFilters, setShowFilters] = useState(false);
  const resultsRef = useRef(null);
  const rows = useMemo(() => rankArtists(artists, filters), [artists, filters]);
  // If the results change and the playing sample is no longer on screen, stop it.
  useEffect(() => {
    const pid = audio.playingId();
    if (pid && !rows.some((r) => r.sample.id === pid)) audio.stop();
  }, [rows]);
  const set = (patch) => setFilters({ ...filters, ...patch });
  const film = filters.category === 'film';
  const role = roleById(filters.role);
  const groups = groupsForFilters(filters);
  const quick = groups.find((g) => g.quick);
  const others = groups.filter((g) => !g.quick);
  const activeTags = [...selectedTags(filters), ...filters.languages];
  const setGroup = (key, v) => set({ tags: { ...filters.tags, [key]: v } });
  const typeOptions = film ? (role.genders ? FILM_GENDERS : null) : TYPES;
  const extraCount = others.reduce((s, g) => s + (filters.tags[g.key] || []).length, 0)
    + filters.types.length + filters.languages.length + filters.experience.length;
  const clear = () => setFilters({ ...DEFAULT_FILTERS, category: filters.category, mode: filters.mode, role: filters.role });
  const headline = film ? HEADLINES[filters.role] : HEADLINES[filters.mode];
  const priceUnit = film ? role.rateLabel : filters.mode === 'stage' ? 'per event' : 'per track';

  return (
    <div className="pb-10">
      <section className="bg-plum px-5 pb-24 pt-8 md:pb-28 md:pt-14">
        <div className="mx-auto max-w-5xl">
          <h1 className="max-w-xl text-[30px] font-extrabold leading-[1.1] tracking-tight text-white md:text-5xl">{headline}</h1>
          <p className="mt-3 max-w-lg text-[15px] text-[#D8CFE6] md:text-base">
            Local singers, bands, actors and film crew with fixed prices in ₹. Ranked on merit, never on payment.
          </p>
        </div>
      </section>

      {/* Search card */}
      <div className="mx-auto -mt-16 max-w-5xl px-4">
        <div className="rounded-[20px] bg-white shadow-[0_8px_28px_rgba(36,18,58,0.16)]">
          <div role="group" aria-label="Category" className="flex gap-1 border-b border-line p-2">
            {[['music', 'Music', 'music'], ['film', 'Film & video', 'film']].map(([c, t, ic]) => (
              <button key={c} type="button" aria-pressed={filters.category === c}
                onClick={() => filters.category !== c && set({ category: c, tags: {}, types: [] })}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-extrabold transition-colors ${
                  filters.category === c ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}>
                <Icon name={ic} size={19} /> {t}
              </button>
            ))}
          </div>

          {film ? (
            <div role="group" aria-label="Role" className="grid grid-cols-1 gap-1 border-b border-line p-2 sm:grid-cols-3">
              {FILM_ROLES.map((r) => (
                <Segment key={r.id} active={filters.role === r.id} icon={r.icon} title={r.label} sub={r.blurb}
                  onClick={() => filters.role !== r.id && set({ role: r.id, tags: {}, types: [] })} />
              ))}
            </div>
          ) : (
            <div role="group" aria-label="Booking mode" className="grid grid-cols-2 gap-1 border-b border-line p-2">
              <Segment active={filters.mode === 'stage'} onClick={() => set({ mode: 'stage' })} icon="stage" title="Stage Mode" sub="Birthdays & live events" />
              <Segment active={filters.mode === 'studio'} onClick={() => set({ mode: 'studio' })} icon="mic" title="Studio Mode" sub="Song production" />
            </div>
          )}

          <div className="grid md:grid-cols-[1fr_1.4fr_auto_auto]">
            <label className="flex items-center gap-3 border-b border-line px-4 py-3 md:border-b-0 md:border-r">
              <Icon name="pin" className="shrink-0 text-muted" />
              <span className="flex flex-1 flex-col">
                <span className="text-xs font-bold text-muted">City</span>
                <select value={filters.city} onChange={(e) => set({ city: e.target.value })}
                  className="min-h-8 w-full cursor-pointer bg-transparent text-base font-bold outline-none">
                  <option value="All">All cities</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </span>
            </label>
            <label className="flex items-center gap-3 border-b border-line px-4 py-3 md:border-b-0 md:border-r">
              <span className="shrink-0 text-lg font-extrabold text-muted" aria-hidden="true">₹</span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="flex justify-between text-xs font-bold text-muted">
                  <span>Max budget {film ? '(per day)' : ''}</span><span className="text-sm font-extrabold text-ink">{money(filters.budget)}</span>
                </span>
                <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={500} value={filters.budget}
                  onChange={(e) => set({ budget: Number(e.target.value) })} className="h-6 w-full cursor-pointer" />
              </span>
            </label>
            <button type="button" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}
              className="flex min-h-14 items-center justify-center gap-2 border-b border-line px-5 text-[15px] font-extrabold hover:bg-surface md:border-b-0 md:border-r">
              <Icon name="sliders" /> Filters{extraCount ? ` (${extraCount})` : ''}
            </button>
            <button type="button" onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="min-h-14 rounded-b-[20px] bg-accent px-8 text-[17px] font-extrabold text-white hover:bg-accent-dark md:rounded-b-none md:rounded-r-[20px]">
              Search
            </button>
          </div>
        </div>

        {quick && (
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-extrabold">{quick.label}</h2>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {quick.options.map((t) => {
                const cur = filters.tags[quick.key] || [];
                return <Pill key={t} active={cur.includes(t)} onClick={() => setGroup(quick.key, toggleIn(cur, t))}>{t}</Pill>;
              })}
            </div>
          </div>
        )}

        {showFilters && (
          <div className="mt-4 grid gap-5 rounded-[20px] border border-line p-5 md:grid-cols-2">
            {others.map((g) => (
              <FilterGroup key={g.key} title={g.label} options={g.options} value={filters.tags[g.key] || []} onChange={(v) => setGroup(g.key, v)} />
            ))}
            {typeOptions && <FilterGroup title={film ? 'Gender' : 'Gender / type'} options={typeOptions} value={filters.types} onChange={(v) => set({ types: v })} />}
            <FilterGroup title="Languages" options={LANGUAGES} value={filters.languages} onChange={(v) => set({ languages: v })} />
            <FilterGroup title="Experience" options={EXPERIENCE} value={filters.experience} onChange={(v) => set({ experience: v })} />
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={clear} className="min-h-11 rounded-full border-2 border-ink px-5 text-sm font-extrabold">Clear all</button>
              <button type="button" onClick={() => setShowFilters(false)} className="min-h-11 rounded-full bg-ink px-5 text-sm font-extrabold text-white">
                Show {rows.length} {rows.length === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        )}
      </div>

      <section ref={resultsRef} className="mx-auto mt-7 max-w-5xl scroll-mt-20 px-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-extrabold">
            {rows.length} {film ? (rows.length === 1 ? role.single.toLowerCase() : role.label.toLowerCase()) : rows.length === 1 ? 'artist' : 'artists'} available
          </h2>
          <p className="text-xs font-semibold text-muted">Ranked by tag match 40% · endorsements 25% · profile strength 20% · rating 15%</p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-[20px] bg-surface p-8 text-center">
            <p className="text-base font-extrabold">Nobody matches these filters yet.</p>
            <p className="mt-1 text-sm text-muted">Try a higher budget, another city or fewer tags.</p>
            <button type="button" onClick={clear} className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-extrabold text-white">Clear filters</button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((r) => <ArtistCard key={r.artist.id} row={r} priceUnit={priceUnit} activeTags={activeTags} onOpen={onOpen} />)}
          </div>
        )}
        <p className="mt-6 text-center text-xs text-muted">Sample profiles are shown for demonstration.</p>
      </section>
    </div>
  );
}

function ArtistCard({ row, priceUnit, activeTags, onOpen }) {
  const { artist: a, price, sample, matched, strength } = row;
  const badges = topEndorsements(a, 3, activeTags);
  return (
    <article className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(36,18,58,0.09)] ring-1 ring-line">
      <button type="button" onClick={() => onOpen(a.id)} className="flex justify-between gap-3 text-left">
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-[17px] font-extrabold leading-tight">{a.name}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-muted">
            <Icon name="pin" size={15} className="shrink-0" /> {a.city} · {roleLabel(a)}
          </span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-extrabold">{a.experience}</span>
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-extrabold">Profile {strength}%</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-xs text-muted">from</span>
          <span className="whitespace-nowrap text-[21px] font-extrabold">{money(price)}</span>
          <span className="text-xs text-muted">{priceUnit}</span>
        </span>
      </button>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => <TagBadge key={b.tag} tag={b.tag} count={b.count} highlight={activeTags.includes(b.tag)} />)}
        </div>
      )}

      <SamplePlayer artist={a} sample={sample} matched={matched} label={matched.length ? 'Matches your filter' : null} />

      <div className="flex items-center gap-3 border-t border-line pt-3">
        <Avatar artist={a} size={36} />
        <span className="flex items-center gap-1 text-sm font-bold">
          <Star size={14} />
          {a.rating ? `${a.rating.toFixed(1)} · ${a.reviews} reviews` : 'New on Ruartist'}
        </span>
        <button type="button" onClick={() => onOpen(a.id)}
          className="ml-auto flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-extrabold text-accent hover:bg-accent-soft">
          View &amp; book <Icon name="chevron" size={18} />
        </button>
      </div>
    </article>
  );
}
