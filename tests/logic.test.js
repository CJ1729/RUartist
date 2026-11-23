import { describe, it, expect, beforeEach } from 'vitest';
import { SEED_ARTISTS, FILM_SEED_ARTISTS, FILM_ROLES, MUSIC_GROUPS, LANGUAGES, CITIES, EXPERIENCE, TYPES, roleById } from '../src/data';
import { strength, strengthParts, quote, rankArtists, loadState, endorsableTags, money } from '../src/logic';

const ALL = [...SEED_ARTISTS, ...FILM_SEED_ARTISTS];
const byId = (id) => ALL.find((a) => a.id === id);
const base = { category: 'music', mode: 'stage', role: 'Character Artist', city: 'All', budget: 25000, tags: {}, types: [], languages: [], experience: [] };
const f = (patch) => ({ ...base, ...patch });

describe('seed data is valid', () => {
  it('has unique ids for artists and samples', () => {
    const ids = ALL.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    const sids = ALL.flatMap((a) => (a.tracks || a.samples).map((s) => s.id));
    expect(new Set(sids).size).toBe(sids.length);
  });
  it('uses only known cities, experience tiers, languages and types', () => {
    for (const a of ALL) {
      expect(CITIES).toContain(a.city);
      expect(EXPERIENCE).toContain(a.experience);
      for (const l of a.languages) expect(LANGUAGES).toContain(l);
      if (a.category === 'film') expect(FILM_ROLES.map((r) => r.id)).toContain(a.role);
      else expect(TYPES).toContain(a.type);
    }
  });
  it('tags every sample only with tags from its own groups (or a language) and within limits', () => {
    for (const a of ALL) {
      const groups = a.category === 'film' ? roleById(a.role).groups : MUSIC_GROUPS;
      for (const s of a.tracks || a.samples) {
        for (const t of s.tags) expect(groups.some((g) => g.options.includes(t)) || LANGUAGES.includes(t), `${a.id} ${t}`).toBe(true);
        for (const g of groups) expect(s.tags.filter((t) => g.options.includes(t)).length).toBeLessThanOrEqual(g.max);
      }
      for (const t of Object.keys(a.endorsements)) expect(groups.some((g) => g.options.includes(t)), `${a.id} endorsement ${t}`).toBe(true);
    }
  });
  it('keeps every price inside the budget slider range', () => {
    for (const a of ALL) {
      const prices = a.category === 'film' ? [a.rate] : [a.stagePrice, a.studioPrice];
      for (const p of prices) { expect(p).toBeGreaterThanOrEqual(1500); expect(p).toBeLessThanOrEqual(25000); }
    }
  });
});

describe('profile strength', () => {
  it('scores a complete music profile at 100', () => expect(strength(byId('a1'))).toBe(100));
  it('gives half the bio points for a short bio', () => {
    expect(strength(byId('a8'))).toBe(95);
    expect(strengthParts(byId('a8')).find((p) => p.label.startsWith('Bio')).pts).toBe(5);
  });
  it('scores a complete film profile at 100', () => expect(strength(byId('f1'))).toBe(100));
  it('scores an empty profile at 0 (5 once a crew role is chosen) and a partly tagged sample proportionally', () => {
    expect(strength({ category: 'film', role: 'Editor', samples: [] })).toBe(5); // choosing the role already counts
    expect(strength({ samples: [], tracks: [] })).toBe(0);
    const a = { category: 'film', role: 'Editor', samples: [{ title: 'Cut', tags: ['Music video'] }] };
    expect(strengthParts(a).find((p) => p.label === 'Sample 1 with tags').pts).toBe(8); // 15 × 2/4
  });
  it('requires gender for actors before the role points count', () => {
    expect(strengthParts({ category: 'film', role: 'Character Artist' }).find((p) => p.label === 'Role').pts).toBe(0);
    expect(strengthParts({ category: 'film', role: 'Character Artist', gender: 'Female' }).find((p) => p.label === 'Role').pts).toBe(5);
    expect(strengthParts({ category: 'film', role: 'Editor' }).find((p) => p.label === 'Role').pts).toBe(5);
  });
});

describe('pricing', () => {
  it('stage with PA: 6,000 + 2,000, 5% fee', () => expect(quote({ artist: byId('a1'), mode: 'stage', pa: true })).toMatchObject({ pkg: 6000, extras: 2000, fee: 400, total: 8400 }));
  it('stage without PA', () => expect(quote({ artist: byId('a1'), mode: 'stage', pa: false }).total).toBe(6300));
  it('studio royalty split charges 60% upfront', () => expect(quote({ artist: byId('a1'), mode: 'studio', deal: 'royalty' })).toMatchObject({ pkg: 2700, fee: 135, total: 2835 }));
  it('studio flat fee', () => expect(quote({ artist: byId('a1'), mode: 'studio', deal: 'flat' }).total).toBe(4725));
  it('cinematographer: 3 days with per-day kit and lights', () =>
    expect(quote({ artist: byId('f8'), mode: 'film', days: 3, addons: ['kit', 'lights'] })).toMatchObject({ pkg: 45000, extras: 81000, fee: 6300, total: 132300 }));
  it('editor: one-off add-on is not multiplied by days', () =>
    expect(quote({ artist: byId('f5'), mode: 'film', days: 2, addons: ['grade'] })).toMatchObject({ pkg: 12000, extras: 4000, total: 16800 }));
  it('actor: dubbing add-on', () => expect(quote({ artist: byId('f1'), mode: 'film', days: 2, addons: ['dub'] }).total).toBe(19950));
  it('ignores add-ons the artist does not offer', () => expect(quote({ artist: byId('f8'), mode: 'film', days: 1, addons: ['drone'] }).extras).toBe(0));
  it('formats rupees the Indian way', () => expect(money(132300).replace(/\s/g, '')).toBe('₹1,32,300'));
});

describe('merit ranking', () => {
  it('lists all 8 musicians in Stage Mode with no filters', () => expect(rankArtists(ALL, f({})).length).toBe(8));
  it('Husky: only artists with a Husky track, ranked by the formula, Husky track loaded', () => {
    const rows = rankArtists(ALL, f({ tags: { texture: ['Husky'] } }));
    expect(rows.map((r) => r.artist.id)).toEqual(['a7', 'a1', 'a5', 'a8']);
    expect(rows[1].sample.id).toBe('a1t1');
    expect(rows[1].matched).toEqual(['Husky']);
    // a1 = 0.4 + 0.25 × 14/17 + 0.2 × 1 + 0.15 × 4.8/5
    expect(rows[1].score).toBeCloseTo(0.4 + 0.25 * (14 / 17) + 0.2 + 0.15 * 0.96, 6);
  });
  it('budget filter uses the price for the current mode', () => {
    expect(rankArtists(ALL, f({ budget: 3000 })).map((r) => r.artist.id).sort()).toEqual(['a4', 'a8']);
    expect(rankArtists(ALL, f({ mode: 'studio', budget: 3000 })).map((r) => r.artist.id).sort()).toEqual(['a4', 'a5', 'a8']);
  });
  it('language + texture picks the track that matches both', () => {
    const rows = rankArtists(ALL, f({ tags: { texture: ['Smooth'] }, languages: ['Tamil'] }));
    expect(rows.map((r) => r.artist.id).sort()).toEqual(['a4', 'a5']);
    expect(rows.find((r) => r.artist.id === 'a5').sample.id).toBe('a5t1');
    expect(rows.every((r) => r.tagMatch === 1)).toBe(true);
  });
  it('film roles are separated and filtered by their own tags', () => {
    expect(rankArtists(ALL, f({ category: 'film', role: 'Character Artist' })).length).toBe(4);
    expect(rankArtists(ALL, f({ category: 'film', role: 'Editor' })).length).toBe(3);
    const cine = rankArtists(ALL, f({ category: 'film', role: 'Cinematographer', tags: { look: ['Low-key/Noir'] } }));
    expect(cine.map((r) => r.artist.id)).toEqual(['f8']);
    expect(cine[0].sample.id).toBe('f8s1');
  });
  it('actor gender filter', () => {
    expect(rankArtists(ALL, f({ category: 'film', role: 'Character Artist', types: ['Female'] })).map((r) => r.artist.id).sort()).toEqual(['f2', 'f4']);
  });
  it('crew samples without a language still count as a language match', () => {
    const rows = rankArtists(ALL, f({ category: 'film', role: 'Editor', languages: ['Kannada'] }));
    expect(rows.map((r) => r.artist.id)).toEqual(['f6']);
    expect(rows[0].tagMatch).toBe(1);
  });
  it('a new endorsement can change the order', () => {
    const before = rankArtists(ALL, f({ tags: { texture: ['Husky'] } }));
    expect(before[0].artist.id).toBe('a7');
    const boosted = ALL.map((a) => (a.id === 'a1' ? { ...a, endorsements: { ...a.endorsements, Husky: 30 } } : a));
    expect(rankArtists(boosted, f({ tags: { texture: ['Husky'] } }))[0].artist.id).toBe('a1');
  });
  it('endorsable tags exclude languages and non-endorsable groups', () => {
    expect(endorsableTags(byId('f8')).sort()).toEqual(['Ad/Commercial', 'Feature film', 'Gimbal/Steadicam', 'Handheld', 'Low-key/Noir', 'Teal & Orange']);
    expect(endorsableTags(byId('a1'))).not.toContain('Hindi');
  });
});

describe('storage', () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
  });
  it('starts with all sample profiles', () => {
    const s = loadState();
    expect(s.artists.length).toBe(18);
    expect(s.bookings).toEqual([]);
  });
  it('adds the new film profiles for a returning visitor and keeps their data', () => {
    store['ruartist:v1'] = JSON.stringify({ artists: [...SEED_ARTISTS, { id: 'u1', name: 'Mine', mine: true }], bookings: [{ id: 'b1' }] });
    const s = loadState();
    expect(s.artists.length).toBe(19);
    expect(s.artists.some((a) => a.id === 'u1')).toBe(true);
    expect(s.bookings).toEqual([{ id: 'b1' }]);
  });
  it('survives broken storage', () => {
    store['ruartist:v1'] = '{not json';
    expect(loadState().artists.length).toBe(18);
  });
});
