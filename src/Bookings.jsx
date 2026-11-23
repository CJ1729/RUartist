import { useState } from 'react';
import { money, prettyDate, endorsableTags } from './logic';
import { roleById } from './data';
import { Modal, Icon, Avatar } from './ui';

export default function Bookings({ bookings, artists, onEndorse, onCancel, onDiscover }) {
  const [endorsing, setEndorsing] = useState(null);
  const byId = Object.fromEntries(artists.map((a) => [a.id, a]));
  const sorted = [...bookings].sort((a, b) => (a.status === b.status ? a.date.localeCompare(b.date) : a.status === 'upcoming' ? -1 : 1));

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8">
      <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-tight md:text-4xl">My bookings</h1>
      <p className="mt-2 text-[15px] text-muted">After the event or delivery, mark it complete and endorse the tags you heard. Endorsements move artists up the rankings.</p>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-[20px] bg-surface p-8 text-center">
          <p className="text-base font-extrabold">No bookings yet.</p>
          <p className="mt-1 text-sm text-muted">Find an artist on Discover and book a package. It will appear here.</p>
          <button type="button" onClick={onDiscover} className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-extrabold text-white">Find an artist</button>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {sorted.map((b) => {
            const a = byId[b.artistId];
            const done = b.status === 'completed';
            return (
              <li key={b.id} className="flex flex-col gap-3 rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(36,18,58,0.09)] ring-1 ring-line">
                <div className="flex items-start gap-3">
                  {a ? <Avatar artist={a} size={44} /> : <span className="h-11 w-11 shrink-0 rounded-full bg-surface" />}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[16px] font-extrabold">{b.artistName}</span>
                    <span className="text-sm text-muted">{b.mode === 'film' ? `${roleById(b.role).single} · ${b.days} ${b.days === 1 ? 'day' : 'days'}` : b.mode === 'stage' ? 'Stage gig' : 'Studio track'} · {b.packageDetail}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm font-bold"><Icon name="calendar" size={16} />{prettyDate(b.date)}</span>
                    {b.pa && <span className="text-sm text-muted">Includes PA speakers and mics</span>}
                    {b.addons && b.addons.length > 0 && <span className="text-sm text-muted">Add-ons: {b.addons.join(', ')}</span>}
                    {b.mode === 'film' && b.reference && <span className="text-sm text-muted">Brief: “{b.reference}”</span>}
                    {b.deal && <span className="text-sm text-muted">{b.deal === 'royalty' ? 'Royalty split' : 'Flat fee buyout'}{b.reference ? ` · “${b.reference}”` : ''}</span>}
                  </div>
                  <span className="flex flex-col items-end">
                    <span className="whitespace-nowrap text-lg font-extrabold">{money(b.total)}</span>
                    <span className={`mt-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${done ? 'bg-ok-soft text-ok' : 'bg-accent-soft text-accent-dark'}`}>{done ? 'Completed' : 'Upcoming'}</span>
                  </span>
                </div>
                {done ? (
                  b.endorsed.length > 0 && <p className="border-t border-line pt-3 text-sm text-muted">You endorsed: <span className="font-bold text-ink">{b.endorsed.join(', ')}</span></p>
                ) : (
                  <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    <button type="button" onClick={() => setEndorsing(b)} disabled={!a}
                      className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-extrabold text-white hover:bg-accent-dark disabled:opacity-40">
                      Mark complete &amp; endorse tags
                    </button>
                    <button type="button" onClick={() => onCancel(b.id)} className="min-h-11 rounded-full border-2 border-line px-4 text-sm font-extrabold hover:border-ink">Cancel</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {endorsing && byId[endorsing.artistId] && (
        <EndorseModal booking={endorsing} artist={byId[endorsing.artistId]} onClose={() => setEndorsing(null)}
          onSubmit={(tags) => { onEndorse(endorsing, tags); setEndorsing(null); }} />
      )}
    </div>
  );
}

function EndorseModal({ booking, artist, onClose, onSubmit }) {
  const tags = endorsableTags(artist);
  const [picked, setPicked] = useState([]);
  const toggle = (t) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  return (
    <Modal title="Complete booking" onClose={onClose}
      footer={
        <button type="button" onClick={() => onSubmit(picked)}
          className="min-h-13 w-full rounded-full bg-accent py-3.5 text-base font-extrabold text-white hover:bg-accent-dark">
          {picked.length ? `Complete and endorse ${picked.length} ${picked.length === 1 ? 'tag' : 'tags'}` : 'Complete without endorsing'}
        </button>
      }>
      <div className="flex flex-col gap-5 p-5">
        <div>
          <h3 className="text-[24px] font-extrabold leading-tight">{booking.mode === 'film' ? `How was working with ${artist.name}?` : `How did ${artist.name} sound?`}</h3>
          <p className="mt-1 text-[15px] text-muted">Tap every tag you can vouch for from your {booking.mode === 'stage' ? 'event' : booking.mode === 'film' ? 'shoot' : 'session'}. Each one adds a verified star.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = picked.includes(t);
            const count = (artist.endorsements || {})[t] || 0;
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => toggle(t)}
                className={`flex min-h-12 items-center gap-2 rounded-full border-2 px-4 text-[15px] font-extrabold transition-colors ${on ? 'border-ok bg-ok text-white' : 'border-line hover:border-ink'}`}>
                {on ? <Icon name="check" size={18} stroke={2.8} /> : <span aria-hidden="true">+1</span>}
                {t}
                <span className={`text-xs font-bold ${on ? 'text-white/80' : 'text-muted'}`}>★ {count + (on ? 1 : 0)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
