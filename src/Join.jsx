import { useMemo, useState } from 'react';
import {
  CITIES, TEXTURES, VIBES, TYPES, LANGUAGES, EXPERIENCE, MAX_TEXTURE_TAGS, AVATAR_COLORS,
  FILM_ROLES, FILM_GENDERS, roleById,
} from './data';
import { strength, strengthParts, money, roleLabel, priceFor } from './logic';
import { Icon, Pill, Avatar } from './ui';

const toggleIn = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
const isUrl = (s) => /^https?:\/\/\S+\.\S+/.test((s || '').trim());
const newId = () => 'u' + Date.now().toString(36);
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
const inputCls = 'min-h-12 rounded-2xl border border-line bg-surface px-4 text-base font-semibold outline-none focus:border-ink';

function Section({ title, hint, children }) {
  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-line p-5">
      <div>
        <h2 className="text-lg font-extrabold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, error }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-extrabold">{label}</span>
      {children}
      {error && <span className="text-sm font-bold text-accent-dark">{error}</span>}
    </label>
  );
}

function PillField({ label, options, value, onChange, multi = true, error, max, render = (o) => o }) {
  const full = multi && max && value.length >= max;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex justify-between text-sm font-extrabold">
        <span>{label}</span>
        {multi && max && <span className={full ? 'text-accent-dark' : 'text-muted'}>{value.length}/{max}</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = multi ? value.includes(o) : value === o;
          return (
            <Pill key={o} size="sm" active={on} disabled={multi && !on && full}
              onClick={() => onChange(multi ? toggleIn(value, o) : on ? '' : o)}>{render(o)}</Pill>
          );
        })}
      </div>
      {error && <span className="text-sm font-bold text-accent-dark">{error}</span>}
    </div>
  );
}

function StrengthMeter({ artist }) {
  const pct = strength(artist);
  const missing = strengthParts(artist).filter((p) => p.pts < p.max).slice(0, 3);
  return (
    <div className="sticky top-2 z-10 rounded-[20px] bg-plum p-4 text-white shadow-lg md:top-20">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-extrabold">Profile strength</span>
        <span className="text-2xl font-extrabold" aria-live="polite">{pct}%</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-plum-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Profile strength">
        <div className="meter-fill h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, background: pct >= 80 ? '#5FD39A' : '#FF8A73' }} />
      </div>
      <p className="mt-2 text-xs text-[#D8CFE6]">
        Strength is 20% of your search rank. {pct >= 100 ? 'Your profile is complete.' : `Next: ${missing.map((m) => m.label.toLowerCase()).join(', ')}.`}
      </p>
    </div>
  );
}

function CommonFields({ d, set, errors, nameLabel }) {
  return (
    <>
      <Field label={nameLabel} error={errors.name}>
        <input className={inputCls} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Meera Krishnan" autoComplete="name" />
      </Field>
      <Field label="City" error={errors.city}>
        <select className={inputCls} value={d.city} onChange={(e) => set({ city: e.target.value })}>
          <option value="">Choose a city</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <PillField label="Experience" options={EXPERIENCE} value={d.experience} multi={false} onChange={(v) => set({ experience: v })} error={errors.experience} />
      <PillField label="Languages you work in" options={LANGUAGES} value={d.languages} onChange={(v) => set({ languages: v })} error={errors.languages} />
      <Field label="Short bio">
        <textarea className={`${inputCls} py-3`} rows={3} value={d.bio} onChange={(e) => set({ bio: e.target.value })}
          placeholder="What you do, where you've worked, what you're great at." />
      </Field>
    </>
  );
}

/* ---------- Music ---------- */
const emptyTrack = () => ({ title: '', textures: [], vibes: [], language: '' });
const MUSIC_EMPTY = { name: '', type: '', city: '', experience: '', languages: [], stagePrice: '', studioPrice: '', bio: '', stagePackage: '', studioPackage: '', tracks: [emptyTrack(), emptyTrack()] };

function toMusicArtist(d) {
  return {
    ...d,
    category: 'music',
    name: d.name.trim(),
    bio: d.bio.trim(),
    stagePrice: Number(d.stagePrice) || 0,
    studioPrice: Number(d.studioPrice) || 0,
    tracks: d.tracks.filter((t) => t.title.trim())
      .map((t) => ({ title: t.title.trim(), tags: [...t.textures, ...t.vibes, ...(t.language ? [t.language] : [])] })),
  };
}

function MusicForm({ onPublish }) {
  const [d, setD] = useState(MUSIC_EMPTY);
  const [errors, setErrors] = useState({});
  const set = (patch) => setD((cur) => ({ ...cur, ...patch }));
  const setTrack = (i, patch) => setD((cur) => ({ ...cur, tracks: cur.tracks.map((t, j) => (j === i ? { ...t, ...patch } : t)) }));
  const preview = useMemo(() => toMusicArtist(d), [d]);

  const publish = (e) => {
    e.preventDefault();
    const er = {};
    if (!preview.name) er.name = 'Add your name or band name.';
    if (!d.type) er.type = 'Choose one.';
    if (!d.city) er.city = 'Choose your city.';
    if (!d.experience) er.experience = 'Choose your experience.';
    if (!d.languages.length) er.languages = 'Pick at least one language.';
    if (!preview.stagePrice && !preview.studioPrice) er.price = 'Set at least one package price.';
    const t1 = d.tracks[0];
    if (!t1.title.trim() || !t1.textures.length) er.track = 'Track 1 needs a title and at least one vocal texture.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const id = newId();
    onPublish({
      ...preview, id, color: randomColor(), rating: null, reviews: 0, availability: [], endorsements: {}, mine: true,
      stagePackage: d.stagePackage.trim() || (preview.stagePrice ? 'Live set, details on request' : ''),
      studioPackage: d.studioPackage.trim() || (preview.studioPrice ? '1 vocal track, details on request' : ''),
      tracks: preview.tracks.map((t, i) => ({ ...t, id: `${id}t${i + 1}` })),
    });
    setD(MUSIC_EMPTY);
  };

  return (
    <>
      <StrengthMeter artist={preview} />
      <form onSubmit={publish} className="mt-4 flex flex-col gap-4" noValidate>
        <Section title="About you">
          <PillField label="You are" options={TYPES} value={d.type} multi={false} onChange={(v) => set({ type: v })} error={errors.type}
            render={(t) => (t === 'Band' ? 'A band' : `${t} vocalist`)} />
          <CommonFields d={d} set={set} errors={errors} nameLabel="Name or band name" />
        </Section>

        <Section title="Packages" hint="Fixed prices in ₹. Hosts see these upfront, with no haggling.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Field label="Stage package price (₹)">
                <input className={inputCls} inputMode="numeric" value={d.stagePrice} onChange={(e) => set({ stagePrice: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 5000" />
              </Field>
              <Field label="What's included (optional)">
                <input className={inputCls} value={d.stagePackage} onChange={(e) => set({ stagePackage: e.target.value })} placeholder="e.g. 90-minute acoustic set" />
              </Field>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Studio package price (₹)">
                <input className={inputCls} inputMode="numeric" value={d.studioPrice} onChange={(e) => set({ studioPrice: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 4000" />
              </Field>
              <Field label="What's included (optional)">
                <input className={inputCls} value={d.studioPackage} onChange={(e) => set({ studioPackage: e.target.value })} placeholder="e.g. 1 lead vocal, 2 revisions" />
              </Field>
            </div>
          </div>
          {errors.price && <span className="text-sm font-bold text-accent-dark">{errors.price}</span>}
        </Section>

        <Section title="Tracks" hint={`Up to 2 tracks. Tag each one honestly, with no more than ${MAX_TEXTURE_TAGS} vocal textures per track.`}>
          {d.tracks.map((t, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
              <Field label={`Track ${i + 1} title${i === 1 ? ' (optional)' : ''}`}>
                <input className={`${inputCls} bg-white`} value={t.title} onChange={(e) => setTrack(i, { title: e.target.value })} placeholder="e.g. Monsoon Letters" />
              </Field>
              <PillField label="Vocal texture" options={TEXTURES} value={t.textures} max={MAX_TEXTURE_TAGS} onChange={(v) => setTrack(i, { textures: v })} />
              <PillField label="Feel / vibe" options={VIBES} value={t.vibes} onChange={(v) => setTrack(i, { vibes: v })} />
              <PillField label="Language" options={LANGUAGES} value={t.language} multi={false} onChange={(v) => setTrack(i, { language: v })} />
            </div>
          ))}
          {errors.track && <span className="text-sm font-bold text-accent-dark">{errors.track}</span>}
          <p className="text-xs text-muted">In this version each track plays a generated melody preview. Real audio uploads need the hosted version with storage.</p>
        </Section>

        <button type="submit" className="min-h-14 rounded-full bg-accent text-[17px] font-extrabold text-white hover:bg-accent-dark">Publish my profile for free</button>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-center text-sm font-bold text-accent-dark">Fix the highlighted fields to publish.</p>}
      </form>
    </>
  );
}

/* ---------- Film & video ---------- */
const emptySample = () => ({ title: '', tags: {}, language: '', link: '' });
const filmEmpty = () => ({ name: '', gender: '', city: '', experience: '', languages: [], rate: '', packageDetail: '', bio: '', showreel: '', kitPrice: '', samples: [emptySample(), emptySample()] });

function toFilmArtist(d, role) {
  return {
    category: 'film', role: role.id,
    name: d.name.trim(), gender: role.genders ? d.gender : undefined,
    city: d.city, experience: d.experience, languages: d.languages,
    rate: Number(d.rate) || 0, packageDetail: d.packageDetail.trim(), bio: d.bio.trim(),
    showreel: isUrl(d.showreel) ? d.showreel.trim() : '',
    samples: d.samples.filter((s) => s.title.trim()).map((s) => ({
      title: s.title.trim(),
      tags: [...role.groups.flatMap((g) => s.tags[g.key] || []), ...(s.language ? [s.language] : [])],
      ...(isUrl(s.link) ? { link: s.link.trim() } : {}),
    })),
  };
}

function FilmForm({ role, onPublish }) {
  const [d, setD] = useState(filmEmpty);
  const [errors, setErrors] = useState({});
  const set = (patch) => setD((cur) => ({ ...cur, ...patch }));
  const setSample = (i, patch) => setD((cur) => ({ ...cur, samples: cur.samples.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const preview = useMemo(() => toFilmArtist(d, role), [d, role]);
  const quick = role.groups.find((g) => g.quick);
  const isCine = role.id === 'Cinematographer';

  const publish = (e) => {
    e.preventDefault();
    const er = {};
    if (!preview.name) er.name = 'Add your name.';
    if (role.genders && !d.gender) er.gender = 'Choose one.';
    if (!d.city) er.city = 'Choose your city.';
    if (!d.experience) er.experience = 'Choose your experience.';
    if (!d.languages.length) er.languages = 'Pick at least one language.';
    if (!preview.rate) er.rate = 'Set your day rate.';
    if (d.showreel.trim() && !isUrl(d.showreel)) er.showreel = 'Use a full link starting with https://';
    const s1 = d.samples[0];
    if (!s1.title.trim() || !(s1.tags[quick.key] || []).length) er.sample = `Sample 1 needs a title and at least one "${quick.label}" tag.`;
    setErrors(er);
    if (Object.keys(er).length) return;
    const id = newId();
    let addons = role.addons;
    if (isCine) {
      const kit = Number(d.kitPrice) || 0;
      addons = role.addons.map((x) => (x.id === 'kit' ? { ...x, price: kit } : x)).filter((x) => x.id !== 'kit' || kit > 0);
    }
    onPublish({
      ...preview, id, color: randomColor(), rating: null, reviews: 0, availability: [], endorsements: {}, mine: true, addons,
      packageDetail: preview.packageDetail || (role.id === 'Editor' ? '8-hour edit day' : '10-hour shoot day'),
      samples: preview.samples.map((s, i) => ({ ...s, id: `${id}s${i + 1}` })),
    });
    setD(filmEmpty());
  };

  return (
    <>
      <StrengthMeter artist={preview} />
      <form onSubmit={publish} className="mt-4 flex flex-col gap-4" noValidate>
        <Section title="About you">
          {role.genders && <PillField label="Gender" options={FILM_GENDERS} value={d.gender} multi={false} onChange={(v) => set({ gender: v })} error={errors.gender} />}
          <CommonFields d={d} set={set} errors={errors} nameLabel="Your name" />
          <Field label="Full showreel link (optional)" error={errors.showreel}>
            <input className={inputCls} inputMode="url" value={d.showreel} onChange={(e) => set({ showreel: e.target.value })} placeholder="https://youtube.com/… or https://vimeo.com/…" />
          </Field>
        </Section>

        <Section title="Your rate" hint="A fixed day rate in ₹, shown upfront to producers and directors.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Day rate (₹, ${role.rateLabel})`} error={errors.rate}>
              <input className={inputCls} inputMode="numeric" value={d.rate} onChange={(e) => set({ rate: e.target.value.replace(/\D/g, '') })} placeholder="e.g. 5000" />
            </Field>
            <Field label="What's included (optional)">
              <input className={inputCls} value={d.packageDetail} onChange={(e) => set({ packageDetail: e.target.value })}
                placeholder={role.id === 'Editor' ? 'e.g. 8-hour edit day, 2 revisions' : 'e.g. 10 hours on set'} />
            </Field>
            {isCine && (
              <Field label="Own camera kit, price per day (optional)">
                <input className={inputCls} inputMode="numeric" value={d.kitPrice} onChange={(e) => set({ kitPrice: e.target.value.replace(/\D/g, '') })} placeholder="Leave empty if you don't own a kit" />
              </Field>
            )}
          </div>
          <p className="text-sm text-muted">
            Optional add-ons offered to producers: {role.addons.filter((x) => !isCine || x.id !== 'kit').map((x) => `${x.label} (+${money(x.price)}${x.perDay ? '/day' : ''})`).join(', ')}.
          </p>
        </Section>

        <Section title={`${role.sampleNoun}s`} hint="Up to 2 samples. Tag each one honestly; every tag group has a limit to stop tag spam.">
          {d.samples.map((s, i) => (
            <div key={i} className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
              <Field label={`${role.sampleNoun} ${i + 1} title${i === 1 ? ' (optional)' : ''}`}>
                <input className={`${inputCls} bg-white`} value={s.title} onChange={(e) => setSample(i, { title: e.target.value })}
                  placeholder={role.id === 'Character Artist' ? 'e.g. Interrogation room' : role.id === 'Editor' ? 'e.g. Indie thriller trailer' : 'e.g. Night market chase'} />
              </Field>
              {role.groups.map((g) => (
                <PillField key={g.key} label={g.label} options={g.options} value={s.tags[g.key] || []} max={g.max}
                  onChange={(v) => setSample(i, { tags: { ...s.tags, [g.key]: v } })} />
              ))}
              {role.id === 'Character Artist' && (
                <PillField label="Language of this clip" options={LANGUAGES} value={s.language} multi={false} onChange={(v) => setSample(i, { language: v })} />
              )}
              <Field label="Link to the clip (optional)">
                <input className={`${inputCls} bg-white`} inputMode="url" value={s.link} onChange={(e) => setSample(i, { link: e.target.value })} placeholder="https://…" />
              </Field>
            </div>
          ))}
          {errors.sample && <span className="text-sm font-bold text-accent-dark">{errors.sample}</span>}
          <p className="text-xs text-muted">Each sample shows a generated preview in your chosen look and pace, and your link opens the real clip.</p>
        </Section>

        <button type="submit" className="min-h-14 rounded-full bg-accent text-[17px] font-extrabold text-white hover:bg-accent-dark">Publish my profile for free</button>
        {Object.keys(errors).length > 0 && <p role="alert" className="text-center text-sm font-bold text-accent-dark">Fix the highlighted fields to publish.</p>}
      </form>
    </>
  );
}

/* ---------- Page ---------- */
const DISCIPLINES = [
  { id: 'music', label: 'Singer, musician or band', icon: 'music' },
  ...FILM_ROLES.map((r) => ({ id: r.id, label: r.single, icon: r.icon })),
];

export default function Join({ myArtists, onPublish, onRemove }) {
  const [discipline, setDiscipline] = useState('music');
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-tight md:text-4xl">Join free. Get booked on merit.</h1>
      <p className="mt-2 max-w-xl text-[15px] text-muted">Listing costs nothing, and nobody can pay to rank above you. A complete profile and endorsements from real bookings move you up.</p>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-extrabold">What do you do?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DISCIPLINES.map((x) => (
            <button key={x.id} type="button" aria-pressed={discipline === x.id} onClick={() => setDiscipline(x.id)}
              className={`flex min-h-20 flex-col items-start justify-between gap-2 rounded-2xl border-2 p-3 text-left text-sm font-extrabold transition-colors ${
                discipline === x.id ? 'border-accent bg-accent-soft text-accent-dark' : 'border-line hover:border-ink'}`}>
              <Icon name={x.icon} size={22} />
              {x.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        {discipline === 'music'
          ? <MusicForm key="music" onPublish={onPublish} />
          : <FilmForm key={discipline} role={roleById(discipline)} onPublish={onPublish} />}
      </div>

      {myArtists.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-extrabold">Profiles you published</h2>
          <ul className="flex flex-col gap-2">
            {myArtists.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                <Avatar artist={a} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-extrabold">{a.name}</span>
                  <span className="text-sm text-muted">{roleLabel(a)} · {a.city} · Strength {strength(a)}% · from {money(priceFor(a, a.stagePrice ? 'stage' : 'studio'))}</span>
                </span>
                <button type="button" onClick={() => onRemove(a.id)} aria-label={`Remove ${a.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-accent-dark">
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
