import { useState } from 'react';
import { PA_FEE, PLATFORM_FEE_RATE, ROYALTY_UPFRONT_RATE, ROYALTY_SHARE_PERCENT, roleById } from './data';
import {
  strength, strengthParts, money, availableDates, prettyDate, todayIso, quote, topEndorsements,
  isFilm, samplesOf, groupsForArtist, roleLabel, addonsOf,
} from './logic';
import { Modal, Avatar, Star, Icon, TagBadge } from './ui';
import { SamplePlayer } from './reel';

export default function ArtistModal({ artist, mode, onClose, onBook }) {
  const [booking, setBooking] = useState(null); // 'stage' | 'studio' | 'film' | null
  if (booking) {
    return <BookingForm artist={artist} mode={booking} onBack={() => setBooking(null)} onClose={onClose} onBook={onBook} />;
  }
  const film = isFilm(artist);
  const role = film ? roleById(artist.role) : null;
  const parts = strengthParts(artist);
  const total = strength(artist);
  const dates = availableDates(artist);
  const badges = topEndorsements(artist, 6);
  const firstGroup = groupsForArtist(artist)[0];
  const grouped = {};
  for (const s of samplesOf(artist)) {
    const key = s.tags.find((t) => firstGroup.options.includes(t)) || 'Other';
    (grouped[key] = grouped[key] || []).push(s);
  }
  const packages = film
    ? [{ key: 'film', title: `${role.single} · day rate`, sub: role.rateLabel, price: artist.rate, detail: artist.packageDetail, icon: role.icon, addons: addonsOf(artist) }]
    : [
      { key: 'stage', title: 'Stage package', sub: 'Birthdays & live events', price: artist.stagePrice, detail: artist.stagePackage, icon: 'stage' },
      { key: 'studio', title: 'Studio package', sub: 'Song production', price: artist.studioPrice, detail: artist.studioPackage, icon: 'mic' },
    ].filter((p) => Number(p.price) > 0).sort((x, y) => (y.key === mode) - (x.key === mode));
  const highlight = (p) => film || p.key === mode;

  return (
    <Modal title={artist.name} onClose={onClose}>
      <div className="flex flex-col gap-6 p-5">
        <section className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="text-[26px] font-extrabold leading-tight tracking-tight">{artist.name}</h3>
            <p className="text-[15px] text-muted">{roleLabel(artist)}{film && artist.gender ? ` · ${artist.gender}` : ''} · {artist.city} · {artist.experience}</p>
            <p className="text-sm text-muted">Speaks {(artist.languages || []).join(', ')}</p>
            <p className="flex items-center gap-1 text-sm font-bold"><Star /> {artist.rating ? `${artist.rating.toFixed(1)}/5 · ${artist.reviews} reviews` : 'New on Ruartist, no reviews yet'}</p>
          </div>
          <Avatar artist={artist} size={72} />
        </section>

        {artist.bio && <p className="text-[15px] leading-relaxed text-muted">{artist.bio}</p>}

        {badges.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-extrabold">Verified by past bookings</h4>
            <div className="flex flex-wrap gap-1.5">{badges.map((b) => <TagBadge key={b.tag} tag={b.tag} count={b.count} />)}</div>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h4 className="text-base font-extrabold">{film ? 'Samples' : 'Tracks'}</h4>
          {Object.entries(grouped).map(([g, list]) => (
            <div key={g} className="flex flex-col gap-2">
              <span className="text-xs font-extrabold text-muted">#{g}</span>
              {list.map((s) => <SamplePlayer key={s.id} artist={artist} sample={s} />)}
            </div>
          ))}
          {artist.showreel && (
            <a href={artist.showreel} target="_blank" rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink text-[15px] font-extrabold text-ink hover:bg-surface">
              <Icon name="link" size={18} /> Watch the full showreel ↗
            </a>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h4 className="text-base font-extrabold">{film ? 'Rate' : 'Packages'}</h4>
          {packages.map((p) => (
            <div key={p.key} className={`flex flex-col gap-3 rounded-2xl border-2 p-4 ${highlight(p) ? 'border-accent' : 'border-line'}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-start gap-3">
                  <Icon name={p.icon} className="mt-0.5 shrink-0" />
                  <span className="flex flex-col">
                    <span className="text-[15px] font-extrabold">{p.title}</span>
                    <span className="text-xs font-semibold text-muted">{p.sub}</span>
                    {p.detail && <span className="mt-1 text-sm">{p.detail}</span>}
                  </span>
                </span>
                <span className="whitespace-nowrap text-xl font-extrabold">{money(p.price)}</span>
              </div>
              {p.addons && p.addons.length > 0 && (
                <ul className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
                  {p.addons.map((x) => (
                    <li key={x.id} className="flex justify-between gap-3">
                      <span className="text-muted">{x.label}</span>
                      <span className="whitespace-nowrap font-bold">+{money(x.price)}{x.perDay ? '/day' : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setBooking(p.key)}
                className={`min-h-12 rounded-full text-[15px] font-extrabold ${highlight(p) ? 'bg-accent text-white hover:bg-accent-dark' : 'border-2 border-ink hover:bg-surface'}`}>
                {film ? `Book ${role.single.toLowerCase()}` : 'Book package'}
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-surface p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h4 className="text-base font-extrabold">Profile strength</h4>
            <span className="text-2xl font-extrabold">{total}%</span>
          </div>
          <ul className="flex flex-col gap-2">
            {parts.map((p) => (
              <li key={p.label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{p.label}</span>
                <span className="text-xs font-bold text-muted">{p.pts}/{p.max}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-[#E4DEEA]">
                  <span className="block h-full rounded-full bg-ok" style={{ width: `${(p.pts / p.max) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="mb-2 text-base font-extrabold">Available dates</h4>
          {dates.length ? (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => <span key={d} className="rounded-full bg-surface px-3 py-2 text-sm font-bold">{prettyDate(d)}</span>)}
            </div>
          ) : <p className="text-sm text-muted">Flexible. Pick any date when you book.</p>}
        </section>
      </div>
    </Modal>
  );
}

function BookingForm({ artist, mode, onBack, onClose, onBook }) {
  const film = mode === 'film';
  const stage = mode === 'stage';
  const role = film ? roleById(artist.role) : null;
  const dates = availableDates(artist);
  const [date, setDate] = useState(dates[0] || '');
  const [pa, setPa] = useState(false);
  const [reference, setReference] = useState('');
  const [deal, setDeal] = useState('flat');
  const [days, setDays] = useState(1);
  const [addons, setAddons] = useState([]);
  const [error, setError] = useState('');
  const addonList = addonsOf(artist);
  const q = quote({ artist, mode, pa, deal, days, addons });
  const dateLabel = film ? role.dateLabel : stage ? 'Event date' : 'Delivery date';

  const submit = (e) => {
    e.preventDefault();
    if (!date) { setError(`Pick a ${dateLabel.toLowerCase()}.`); return; }
    if (date < todayIso()) { setError('That date has already passed.'); return; }
    onBook({
      id: 'b' + Date.now().toString(36),
      artistId: artist.id, artistName: artist.name, mode, date,
      role: film ? artist.role : null,
      packageName: film ? `${role.single} booking` : stage ? 'Stage package' : 'Studio package',
      packageDetail: film ? artist.packageDetail : stage ? artist.stagePackage : artist.studioPackage,
      days: film ? days : null,
      addons: film ? addonList.filter((x) => addons.includes(x.id)).map((x) => x.label) : [],
      pa: stage && pa, reference: stage ? '' : reference.trim(), deal: mode === 'studio' ? deal : null,
      ...q, status: 'upcoming', endorsed: [], createdAt: new Date().toISOString(),
    });
  };

  const title = film ? `Book ${artist.name.split(' ')[0]} as ${role.single.toLowerCase()}` : stage ? 'Book a live set' : 'Book a studio track';

  return (
    <Modal title={`Book ${artist.name}`} onClose={onClose}
      footer={
        <button type="submit" form="booking-form"
          className="min-h-13 w-full rounded-full bg-accent py-3.5 text-base font-extrabold text-white hover:bg-accent-dark">
          Confirm booking · {money(q.total)}
        </button>
      }>
      <form id="booking-form" onSubmit={submit} className="flex flex-col gap-6 p-5">
        <button type="button" onClick={onBack} className="-ml-2 flex min-h-11 items-center gap-1 self-start rounded-full px-2 text-sm font-extrabold hover:bg-surface">
          <Icon name="back" size={18} /> Back to profile
        </button>
        <div>
          <h3 className="text-[26px] font-extrabold leading-tight tracking-tight">{title}</h3>
          <p className="mt-1 text-[15px] text-muted">{film ? artist.packageDetail : stage ? artist.stagePackage : artist.studioPackage}</p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-base font-extrabold">{dateLabel}</legend>
          {dates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => (
                <button key={d} type="button" aria-pressed={date === d} onClick={() => { setDate(d); setError(''); }}
                  className={`min-h-11 rounded-full border px-4 text-sm font-bold ${date === d ? 'border-ink bg-ink text-white' : 'border-[#D9D3E0] hover:border-ink'}`}>
                  {prettyDate(d)}
                </button>
              ))}
            </div>
          )}
          <label className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
            <Icon name="calendar" className="shrink-0 text-muted" />
            <span className="sr-only">Choose another date</span>
            <input type="date" min={todayIso()} value={date} onChange={(e) => { setDate(e.target.value); setError(''); }}
              className="min-h-8 flex-1 bg-transparent text-base font-bold outline-none" />
          </label>
          {error && <p role="alert" className="text-sm font-bold text-accent-dark">{error}</p>}
        </fieldset>

        {film && (
          <>
            <div className="flex items-center justify-between gap-4">
              <span className="flex flex-col">
                <span className="text-base font-extrabold">{role.daysLabel}</span>
                <span className="text-sm text-muted">{money(artist.rate)} {role.rateLabel}</span>
              </span>
              <span className="flex items-center gap-3">
                <button type="button" aria-label="One day fewer" onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent text-xl font-extrabold text-accent">−</button>
                <span className="w-8 text-center text-2xl font-extrabold" aria-live="polite">{days}</span>
                <button type="button" aria-label="One day more" onClick={() => setDays((d) => Math.min(30, d + 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent text-xl font-extrabold text-accent">+</button>
              </span>
            </div>
            {addonList.length > 0 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-base font-extrabold">Add-ons</legend>
                {addonList.map((x) => (
                  <label key={x.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line p-4">
                    <input type="checkbox" checked={addons.includes(x.id)} className="h-5 w-5 shrink-0"
                      onChange={() => setAddons((a) => (a.includes(x.id) ? a.filter((y) => y !== x.id) : [...a, x.id]))} />
                    <span className="flex-1 text-[15px] font-bold">{x.label}</span>
                    <span className="whitespace-nowrap text-sm font-extrabold">+{money(x.price)}{x.perDay ? '/day' : ''}</span>
                  </label>
                ))}
              </fieldset>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-base font-extrabold">{role.briefLabel}</span>
              <textarea value={reference} onChange={(e) => setReference(e.target.value)} rows={3} placeholder={role.briefPlaceholder}
                className="rounded-2xl border border-line bg-surface p-4 text-base outline-none focus:border-ink" />
            </label>
          </>
        )}

        {stage && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
            <input type="checkbox" checked={pa} onChange={(e) => setPa(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
            <span className="flex flex-col">
              <span className="text-[15px] font-extrabold">Need the artist to bring PA speakers and mics (+{money(PA_FEE)})</span>
              <span className="text-sm text-muted">Tick this if your venue has no sound system.</span>
            </span>
          </label>
        )}

        {mode === 'studio' && (
          <>
            <label className="flex flex-col gap-2">
              <span className="text-base font-extrabold">Reference song / scale notes</span>
              <textarea value={reference} onChange={(e) => setReference(e.target.value)} rows={3}
                placeholder="e.g. Reference: a slow Telugu ballad. Key: C# minor, 78 BPM."
                className="rounded-2xl border border-line bg-surface p-4 text-base outline-none focus:border-ink" />
            </label>
            <fieldset>
              <legend className="mb-2 text-base font-extrabold">Rights</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[['flat', 'Flat fee buyout', 'You own the vocal outright.'],
                  ['royalty', 'Royalty split', `Pay ${Math.round(ROYALTY_UPFRONT_RATE * 100)}% now; the artist keeps ${ROYALTY_SHARE_PERCENT}% of royalties.`]].map(([k, t, s]) => (
                  <button key={k} type="button" aria-pressed={deal === k} onClick={() => setDeal(k)}
                    className={`flex flex-col rounded-2xl border-2 p-4 text-left ${deal === k ? 'border-accent bg-accent-soft' : 'border-line'}`}>
                    <span className="text-[15px] font-extrabold">{t}</span>
                    <span className="text-sm text-muted">{s}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}

        <section className="flex flex-col gap-2 text-[15px]">
          <h4 className="text-base font-extrabold">Price details</h4>
          <div className="flex justify-between gap-3">
            <span className="text-muted">
              {film ? `${money(artist.rate)} × ${days} ${days === 1 ? 'day' : 'days'}` : stage ? 'Stage package' : deal === 'royalty' ? 'Studio package (upfront part)' : 'Studio package'}
            </span>
            <span className="font-bold">{money(q.pkg)}</span>
          </div>
          {q.extras > 0 && <div className="flex justify-between gap-3"><span className="text-muted">{film ? 'Add-ons' : 'PA speakers and mics'}</span><span className="font-bold">{money(q.extras)}</span></div>}
          <div className="flex justify-between gap-3"><span className="text-muted">Ruartist booking fee ({Math.round(PLATFORM_FEE_RATE * 100)}%)</span><span className="font-bold">{money(q.fee)}</span></div>
          <div className="mt-1 flex justify-between border-t border-line pt-3 text-lg font-extrabold"><span>Total</span><span>{money(q.total)}</span></div>
        </section>
      </form>
    </Modal>
  );
}
