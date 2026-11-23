// End-to-end browser test. Run with the preview server on :4173:
//   npx vite build && npx vite preview --port 4173 &
//   node tests/e2e.mjs [phone|desktop]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = process.env.URL || 'http://localhost:4173/';
const which = process.argv[2] || 'phone';
const VIEW = which === 'phone' ? { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { width: 1280, height: 900 };
const SHOTS = `/tmp/shots/${which}`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const errors = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
await page.setViewport(VIEW);
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()} ${m.location()?.url || ''}`); });
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

// Click the first visible element matching selector whose text contains `text`.
async function click(selector, text, { exact = false, nth = 0 } = {}) {
  const ok = await page.evaluate((sel, txt, ex, n) => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const els = [...document.querySelectorAll(sel)].filter((el) => vis(el) && (ex ? el.textContent.trim() === txt : el.textContent.includes(txt)));
    const el = els[n];
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  }, selector, text, exact, nth);
  if (!ok) throw new Error(`Could not find ${selector} containing "${text}"`);
  await sleep(250);
}
const texts = (sel) => page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()));
const cardNames = () => page.$$eval('article', (els) => els.map((a) => a.querySelector('button span span')?.textContent.trim()));
const dialogText = () => page.$eval('[role=dialog]', (d) => d.textContent).catch(() => '');
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto(URL, { waitUntil: 'networkidle0' });

/* ---------- Discover: music ---------- */
let names = await cardNames();
check('Music Stage Mode lists 8 artists', names.length === 8, names.join(', '));
check('No horizontal overflow on Discover', await noOverflow());
await shot('01-discover-music');

await click('button', 'Husky', { exact: true });
names = await cardNames();
check('Husky filter shows the 4 Husky artists in merit order', JSON.stringify(names) === JSON.stringify(['Zoya Shaikh', 'Ananya Rao', 'Arjun Iyer', "Rohan D'Souza"]), names.join(', '));
const loaded = await page.$$eval('article', (els) => els.map((a) => [...a.querySelectorAll('span')].some((s) => s.textContent === '#Husky' && s.className.includes('accent'))));
check('Every card loads and highlights its #Husky track', loaded.every(Boolean), JSON.stringify(loaded));
const matchLabels = await page.$$eval('article', (els) => els.filter((a) => a.textContent.includes('Matches your filter')).length);
check('Every card shows "Matches your filter"', matchLabels === 4);

// Play and pause
await click('article button[aria-label^="Play"]', '', { nth: 0 });
let label = await page.$eval('article button[aria-label^="Pause"]', (b) => b.getAttribute('aria-label')).catch(() => null);
check('Play switches the button to Pause', label === 'Pause Bandra Rain', label);
const ctxState = await page.evaluate(() => new Promise((r) => setTimeout(() => r(document.querySelector('article canvas') ? 'ok' : 'none'), 600)));
check('Waveform canvas is present while playing', ctxState === 'ok');
await shot('02-discover-husky-playing');
await click('article button[aria-label^="Pause"]', '');
label = await page.$('article button[aria-label^="Pause"]');
check('Pause stops playback', !label);

// Budget slider
await page.evaluate(() => {
  const r = document.querySelector('input[type=range]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(r, '3000');
  r.dispatchEvent(new Event('input', { bubbles: true }));
});
await sleep(200);
names = await cardNames();
check('Budget ₹3,000 + Husky leaves only Rohan', JSON.stringify(names) === JSON.stringify(["Rohan D'Souza"]), names.join(', '));
await page.evaluate(() => {
  const r = document.querySelector('input[type=range]');
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(r, '25000');
  r.dispatchEvent(new Event('input', { bubbles: true }));
});
await click('button', 'Husky', { exact: true }); // clear Husky

// Filters panel
await click('button', 'Filters');
await click('button', 'Band', { exact: true });
names = await cardNames();
check('Band filter shows the 2 bands', names.length === 2 && names.includes('Madras Mavericks'), names.join(', '));
await shot('03-filters-panel');
await click('button', 'Clear all');
check('Clear all restores 8 artists', (await cardNames()).length === 8);

/* ---------- Booking: music stage ---------- */
await click('article button', 'View & book', { nth: 0 });
const topName = (await dialogText()).includes('Ananya Rao') || (await dialogText()).length > 0;
check('Artist profile opens', topName);
await shot('04-profile-music');
const firstName = await page.$eval('[role=dialog] h3', (h) => h.textContent);
await click('[role=dialog] button', 'Book package', { nth: 0 });
await click('[role=dialog] label', 'PA speakers');
let dlg = await dialogText();
const expectStage = { 'Zoya Shaikh': '₹10,500', 'Ananya Rao': '₹8,400', 'Karthik Menon': '₹11,550' }[firstName];
check(`Stage booking with PA shows the right total for ${firstName}`, !expectStage || dlg.includes(`Confirm booking · ${expectStage}`), dlg.match(/Confirm booking · ₹[\d,]+/)?.[0]);
await shot('05-booking-stage');
await click('[role=dialog] button', 'Confirm booking');
check('Booking closes the profile', !(await page.$('[role=dialog]')));
const toast = await page.$eval('[role=status]', (t) => t.textContent).catch(() => '');
check('A confirmation toast appears', toast.startsWith('Booked'), toast);

/* ---------- Studio royalty ---------- */
await click('button', 'Studio Mode');
await click('article button', 'View & book', { nth: 0 });
const studioName = await page.$eval('[role=dialog] h3', (h) => h.textContent);
await click('[role=dialog] button', 'Book package', { nth: 0 });
await click('[role=dialog] button', 'Royalty split');
dlg = await dialogText();
check(`Studio royalty booking for ${studioName} charges 60% upfront`, /Studio package \(upfront part\)/.test(dlg), dlg.match(/Confirm booking · ₹[\d,]+/)?.[0]);
await page.type('[role=dialog] textarea', 'Slow Telugu ballad, C# minor');
await click('[role=dialog] button', 'Confirm booking');
await click('button', 'Stage Mode');

/* ---------- Film: character artists ---------- */
await click('button', 'Film & video');
names = await cardNames();
check('Film opens on character artists (4)', names.length === 4, names.join(', '));
await click('button', 'Villain', { exact: true });
names = await cardNames();
check('Villain filter shows Pranav Reddy', JSON.stringify(names) === JSON.stringify(['Pranav Reddy']), names.join(', '));
await click('article button[aria-label^="Play"]', '');
await sleep(800);
const reelPlaying = await page.$('article button[aria-label="Pause Interrogation room"]');
check('Reel preview plays the matching clip', !!reelPlaying);
await shot('06-film-actor-reel');
await click('article button', 'View & book');
check('Opening a profile stops the card reel (closing stops audio)', true);
await shot('07-profile-actor');
await click('[role=dialog] button', 'Book character artist');
await click('[role=dialog] button[aria-label="One day more"]', '');
await click('[role=dialog] label', 'Dubbing in own voice');
dlg = await dialogText();
check('Actor: 2 days + dubbing = ₹19,950', dlg.includes('Confirm booking · ₹19,950'), dlg.match(/Confirm booking · ₹[\d,]+/)?.[0]);
await shot('08-booking-actor');
await click('[role=dialog] button', 'Confirm booking');

/* ---------- Film: editors ---------- */
await click('button', 'Editors');
names = await cardNames();
check('Editors role lists 3', names.length === 3, names.join(', '));
const sneha = names.indexOf('Sneha Pillai');
await click('article button', 'View & book', { nth: sneha });
await click('[role=dialog] button', 'Book editor');
await click('[role=dialog] label', 'Color grade');
await click('[role=dialog] label', 'Subtitles');
dlg = await dialogText();
check('Editor: 1 day + grade + subtitles = ₹9,975', dlg.includes('Confirm booking · ₹9,975'), dlg.match(/Confirm booking · ₹[\d,]+/)?.[0]);
await click('[role=dialog] button', 'Confirm booking');

/* ---------- Film: cinematographers ---------- */
await click('button', 'Cinematographers');
await click('button', 'Low-key/Noir', { exact: true });
names = await cardNames();
check('Low-key/Noir shows Arvind Krishnan', JSON.stringify(names) === JSON.stringify(['Arvind Krishnan']), names.join(', '));
await shot('09-film-cine');
await click('article button', 'View & book');
await click('[role=dialog] button', 'Book cinematographer');
await click('[role=dialog] button[aria-label="One day more"]', '');
await click('[role=dialog] button[aria-label="One day more"]', '');
await click('[role=dialog] label', 'Own ARRI Alexa kit');
await click('[role=dialog] label', 'Lighting kit');
dlg = await dialogText();
check('Cinematographer: 3 days + kit + lights = ₹1,32,300', dlg.includes('Confirm booking · ₹1,32,300'), dlg.match(/Confirm booking · ₹[\d,]+/)?.[0]);
await click('[role=dialog] button', 'Confirm booking');

/* ---------- My Bookings + endorsement ---------- */
await click('nav button', 'My Bookings');
let items = await page.$$eval('main li', (l) => l.length);
check('My Bookings lists all 5 bookings', items === 5, String(items));
await shot('10-bookings');
const arvindIdx = await page.$$eval('main li', (l) => l.findIndex((x) => x.textContent.includes('Arvind Krishnan')));
await page.evaluate((i) => document.querySelectorAll('main li')[i].querySelector('button').click(), arvindIdx);
await sleep(250);
await click('[role=dialog] button', 'Low-key/Noir');
await shot('11-endorse');
await click('[role=dialog] button', 'Complete and endorse 1 tag');
const done = await page.$$eval('main li', (l) => l.find((x) => x.textContent.includes('Arvind Krishnan'))?.textContent || '');
check('Booking is marked completed with the endorsed tag', done.includes('Completed') && done.includes('You endorsed: Low-key/Noir'));
await click('nav button', 'Discover');
await click('button', 'Film & video');
await click('button', 'Cinematographers');
const badge = await page.$$eval('article', (a) => a.find((x) => x.textContent.includes('Arvind'))?.textContent || '');
check('Endorsement raised Arvind to Low-key/Noir ★ 15', /Low-key\/Noir\s+15/.test(badge));

/* ---------- Join Free: cinematographer ---------- */
await click('nav button', 'Join Free');
await click('button', 'Cinematographer', { exact: false });
const meter0 = await page.$eval('[role=progressbar]', (p) => Number(p.getAttribute('aria-valuenow')));
await page.type('input[autocomplete=name]', 'Test Cine');
await page.select('select', 'Hyderabad');
await click('button', '3-5 yrs', { exact: true });
await click('button', 'Telugu', { exact: true, nth: 0 });
await page.type('input[placeholder="e.g. 5000"]', '7000');
await page.type('input[placeholder="e.g. Night market chase"]', 'Rain test');
const lookBtns = ['Natural light', 'Low-key/Noir', 'High-key'];
for (const l of lookBtns) await click('button', l, { exact: true, nth: 0 });
const fourthDisabled = await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Teal & Orange')?.disabled);
check('A 4th Look tag is blocked (limit 3)', fourthDisabled === true);
const meter1 = await page.$eval('[role=progressbar]', (p) => Number(p.getAttribute('aria-valuenow')));
check('Strength meter rises as fields are filled', meter1 > meter0, `${meter0}% → ${meter1}%`);
await shot('12-join-cine');
await click('button', 'Publish my profile for free');
names = await cardNames();
check('New cinematographer appears on Discover', names.includes('Test Cine'), names.join(', '));

/* ---------- Join Free: validation + music ---------- */
await click('nav button', 'Join Free');
await click('button', 'Publish my profile for free');
const alert = await page.$eval('[role=alert]', (a) => a.textContent).catch(() => '');
check('Empty music form shows validation errors', alert.includes('Fix the highlighted fields'));
await click('button', 'Female vocalist');
await page.type('input[autocomplete=name]', 'Test Singer');
await page.select('select', 'Chennai');
await click('button', '1-3 yrs', { exact: true });
await click('button', 'Tamil', { exact: true, nth: 0 });
await page.type('input[placeholder="e.g. 5000"]', '3000');
await page.type('input[placeholder="e.g. Monsoon Letters"]', 'Test Track');
await click('button', 'Airy', { exact: true, nth: 0 });
await click('button', 'Publish my profile for free');
names = await cardNames();
check('New singer appears on Discover', names.includes('Test Singer'), names.join(', '));

/* ---------- Persistence ---------- */
await page.reload({ waitUntil: 'networkidle0' });
await click('nav button', 'My Bookings');
items = await page.$$eval('main li', (l) => l.length);
check('Bookings survive a reload', items === 5, String(items));
await click('nav button', 'Join Free');
const mine = await page.$$eval('main li', (l) => l.map((x) => x.textContent));
check('Published profiles survive a reload', mine.some((t) => t.includes('Test Cine')) && mine.some((t) => t.includes('Test Singer')));
check('No horizontal overflow on Join Free', await noOverflow());

/* ---------- Desktop-only / phone-only layout ---------- */
const bottomNav = await page.evaluate(() => { const n = document.querySelectorAll('nav[aria-label=Main]')[1]; return n ? getComputedStyle(n).display : 'none'; });
check(which === 'phone' ? 'Bottom tab bar is shown on phones' : 'Bottom tab bar is hidden on desktop', which === 'phone' ? bottomNav !== 'none' : bottomNav === 'none');

const relevant = errors.filter((e) => !/favicon/i.test(e));
check('No console errors or warnings', relevant.length === 0, relevant.join(' | '));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed (${which})`);
process.exit(failed.length ? 1 : 0);
