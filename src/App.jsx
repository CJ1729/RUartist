import { useCallback, useEffect, useRef, useState } from 'react';
import Discover, { DEFAULT_FILTERS } from './Discover';
import ArtistModal from './ArtistModal';
import Join from './Join';
import Bookings from './Bookings';
import { Icon, Toast } from './ui';
import { loadState, saveState } from './logic';
import * as audio from './audio';

const TABS = [
  { id: 'discover', label: 'Discover', icon: 'search' },
  { id: 'join', label: 'Join Free', long: 'Join Free (Artists)', icon: 'plus' },
  { id: 'bookings', label: 'My Bookings', icon: 'calendar' },
];
const tabFromHash = () => {
  const h = (window.location.hash || '').replace('#', '');
  return TABS.some((t) => t.id === h) ? h : 'discover';
};

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState(tabFromHash);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (id) => {
    audio.stop();
    setTab(id);
    if (window.location.hash !== '#' + id) {
      try { history.replaceState(null, '', '#' + id); } catch { window.location.hash = id; }
    }
    window.scrollTo(0, 0);
  };

  const openArtist = state.artists.find((a) => a.id === openId);
  const closeModal = useCallback(() => { audio.stop(); setOpenId(null); }, []);

  // Android hardware back button: close the open profile, then return to Discover, then exit.
  const backRef = useRef(() => {});
  backRef.current = (exitApp) => {
    if (openId) closeModal();
    else if (tab !== 'discover') go('discover');
    else exitApp();
  };
  useEffect(() => {
    let handle = null;
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { App: NativeApp } = await import('@capacitor/app');
        const h = await NativeApp.addListener('backButton', () => backRef.current(() => NativeApp.exitApp()));
        if (cancelled) h.remove(); else handle = h;
      } catch { /* not running inside the Android app */ }
    })();
    return () => { cancelled = true; if (handle) handle.remove(); };
  }, []);

  const addBooking = (b) => {
    setState((s) => ({ ...s, bookings: [b, ...s.bookings] }));
    setOpenId(null);
    audio.stop();
    setToast({ text: `Booked ${b.artistName} for ${b.date.split('-').reverse().join('/')}.`, action: { label: 'View', run: () => go('bookings') } });
  };

  const endorse = (booking, tags) => {
    setState((s) => ({
      artists: s.artists.map((a) => {
        if (a.id !== booking.artistId) return a;
        const e = { ...(a.endorsements || {}) };
        for (const t of tags) e[t] = (e[t] || 0) + 1;
        return { ...a, endorsements: e };
      }),
      bookings: s.bookings.map((b) => (b.id === booking.id ? { ...b, status: 'completed', endorsed: tags } : b)),
    }));
    setToast({ text: tags.length ? `Thanks. ${booking.artistName}'s ranking is updated.` : 'Booking marked complete.' });
  };

  const cancelBooking = (id) => setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }));

  const publish = (artist) => {
    setState((s) => ({ ...s, artists: [...s.artists, artist] }));
    setFilters({
      ...DEFAULT_FILTERS,
      category: artist.category === 'film' ? 'film' : 'music',
      role: artist.role || DEFAULT_FILTERS.role,
      mode: artist.category !== 'film' && !artist.stagePrice ? 'studio' : 'stage',
    });
    go('discover');
    setToast({ text: `${artist.name} is live on Discover.`, action: { label: 'View', run: () => setOpenId(artist.id) } });
  };
  const removeArtist = (id) => setState((s) => ({ ...s, artists: s.artists.filter((a) => a.id !== id) }));

  const upcoming = state.bookings.filter((b) => b.status === 'upcoming').length;

  return (
    <div className="min-h-screen bg-white pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
      {/* Top bar: logo on phones, logo and tabs on wider screens */}
      <header className={`safe-top sticky top-0 z-40 ${tab === 'discover' ? 'bg-plum' : 'border-b border-line bg-white'}`}>
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-5">
          <button type="button" onClick={() => go('discover')} className="flex items-center gap-2.5" aria-label="Ruartist home">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent text-white"><Icon name="music" size={18} stroke={2.4} /></span>
            <span className={`text-[22px] font-extrabold tracking-tight ${tab === 'discover' ? 'text-white' : 'text-ink'}`}>ruartist</span>
          </button>
          <nav aria-label="Main" className="ml-auto hidden gap-1 md:flex">
            {TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}
                className={`min-h-11 rounded-full px-4 text-[15px] font-extrabold transition-colors ${
                  tab === t.id
                    ? (tab === 'discover' ? 'bg-white text-ink' : 'bg-ink text-white')
                    : (tab === 'discover' ? 'text-white hover:bg-plum-2' : 'text-ink hover:bg-surface')}`}>
                {t.long || t.label}{t.id === 'bookings' && upcoming ? ` (${upcoming})` : ''}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {tab === 'discover' && <Discover artists={state.artists} filters={filters} setFilters={setFilters} onOpen={setOpenId} />}
        {tab === 'join' && <Join myArtists={state.artists.filter((a) => a.mine)} onPublish={publish} onRemove={removeArtist} />}
        {tab === 'bookings' && <Bookings bookings={state.bookings} artists={state.artists} onEndorse={endorse} onCancel={cancelBooking} onDiscover={() => go('discover')} />}
      </main>

      {/* Bottom tab bar on phones, like the prototype */}
      <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
        <div className="flex h-[68px]">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-bold ${tab === t.id ? 'text-accent' : 'text-muted'}`}>
              <Icon name={t.icon} size={24} />
              {t.label}
              {t.id === 'bookings' && upcoming > 0 && (
                <span className="absolute right-[calc(50%-22px)] top-2 min-w-5 rounded-full bg-accent px-1.5 text-[11px] font-extrabold leading-5 text-white">{upcoming}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {openArtist && <ArtistModal key={openArtist.id} artist={openArtist} mode={filters.mode} onClose={closeModal} onBook={addBooking} />}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
