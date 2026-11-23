# Ruartist

Ruartist connects local talent with the people who hire it. It has two sides:

- **Music:** singers, musicians and bands, for event hosts (Stage Mode) and music producers (Studio Mode).
- **Film & video:** character artists (actors), editors and cinematographers, for directors, producers and brands.

Everyone joins for free and is ranked on merit only.

The project is one React + Tailwind web app. The same code runs as a website and, through Capacitor, as an Android app.

## What's inside

| Path | What it is |
| --- | --- |
| `src/` | The app: Discover, Join Free, My Bookings, the artist profile, booking and the audio player |
| `src/data.js` | Cities, tags, seed artists, and every price and fee rule in one place |
| `src/logic.js` | Merit ranking, profile strength, pricing and storage |
| `src/audio.js` | Web Audio preview engine. It generates each track's melody, so there are no audio files to break |
| `src/reel.jsx` | Film sample previews: a generated reel drawn in the sample's look, camera movement, cutting pace and aspect ratio, with a generated score |
| `android/` | The native Android project (Capacitor 7) |
| `.github/workflows/android-apk.yml` | Builds the APK on GitHub's servers |
| `.github/workflows/deploy-website.yml` | Publishes the website to GitHub Pages |

## Get the APK (no Android tools needed)

1. Create a new **private** repository on GitHub and push this folder to it:
   ```bash
   git init && git add . && git commit -m "Ruartist 1.0"
   git branch -M main
   git remote add origin https://github.com/<you>/ruartist.git
   git push -u origin main
   ```
2. Open the repository's **Actions** tab. The *Build Android APK* run starts on its own and takes about 5 to 8 minutes.
3. Open the finished run and download **ruartist-debug-apk** from the *Artifacts* section. Unzip it to get `app-debug.apk`.
4. Copy the APK to an Android phone and open it. You may have to allow "Install unknown apps" for your file manager.

The debug APK is fine for testing and for sharing with friends. For the Play Store you need a signed release build, which the next section covers.

## Signed release build (for the Play Store)

1. Create a signing key once. Keep the file and its passwords safe: losing them means you can never update the app.
   ```bash
   keytool -genkeypair -v -keystore ruartist-release.jks -alias ruartist \
     -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 ruartist-release.jks > keystore.txt   # on macOS: base64 -i ruartist-release.jks > keystore.txt
   ```
2. In GitHub, open **Settings → Secrets and variables → Actions** and add four repository secrets:
   - `ANDROID_KEYSTORE_BASE64`: the contents of `keystore.txt`
   - `ANDROID_KEYSTORE_PASSWORD`: the keystore password
   - `ANDROID_KEY_ALIAS`: `ruartist`
   - `ANDROID_KEY_PASSWORD`: the key password
3. Run the workflow again from the Actions tab (*Run workflow*). It now also uploads **ruartist-release**, which holds:
   - `app-release.apk`: a signed APK you can share
   - `app-release.aab`: the bundle you upload to Google Play Console

Before each new release, raise `versionCode` and `versionName` in `android/app/build.gradle`.

## Build in Android Studio instead

```bash
npm install
npm run android:sync     # builds the web app and copies it into android/
npx cap open android     # opens Android Studio
```
Then choose **Build → Build App Bundle(s) / APK(s) → Build APK(s)**. You need Android Studio with JDK 21.

## The website

- **Run it locally:** `npm install && npm run dev`
- **Build it:** `npm run build`. Upload the `dist/` folder to any static host, such as Netlify, Vercel, Cloudflare Pages or your own server.
- **Host it on GitHub Pages:** in the repository, open **Settings → Pages** and set *Source* to **GitHub Actions**. After that, every push to `main` republishes the site at `https://<your-username>.github.io/<repo-name>/`.
- **One-file version:** `npm run build:single` writes a single `dist-single/index.html` with everything inlined.

## Checks

- `npm run lint`: lint the source for errors.
- `npm test`: 30 tests of the ranking, profile strength, pricing, seed data and storage.
- `npm run test:e2e`: browser tests at phone and desktop sizes. They need Chrome at `/usr/bin/google-chrome` and the preview server running (`npm run build && npx vite preview --port 4173`).

## Changing prices, fees and content

Everything lives in `src/data.js`:

- `PA_FEE`: the PA speakers and mics add-on (₹2,000)
- `PLATFORM_FEE_RATE`: the Ruartist booking fee shown at checkout (5%)
- `ROYALTY_UPFRONT_RATE` and `ROYALTY_SHARE_PERCENT`: the terms of the Royalty split option
- `SEED_ARTISTS` and `FILM_SEED_ARTISTS`: the 8 sample musicians and 10 sample film professionals. Replace them with real people, or empty the lists, before launch.
- `FILM_ROLES`: everything about each film role. That includes its tag groups (character type, acting style, skills and playing age for actors; project type, editing style, software and post skills for editors; look, camera style, camera system and project type for cinematographers), the per-sample tag limits, which tags can be endorsed, booking labels and default add-ons. To add a role such as dubbing artist or make-up artist, add one more entry here.
- `MUSIC_GROUPS`: the vocal texture and vibe tags for music.

Film professionals charge a day rate. When booking, the producer picks the number of days and any add-ons (for example the cinematographer's own camera kit per day, or the editor's color grade), and the total is calculated from those. Artists can add a link to their full showreel and to each clip, which opens on YouTube, Vimeo or wherever they host it.

The ranking formula is in `rankArtists()` in `src/logic.js`: 40% tag match, 25% tag endorsements, 20% profile strength, 15% rating.

## Before a public launch: read this

As the spec asked, this version keeps all data in the browser's `localStorage`. That has two consequences:

- **Each phone or browser has its own copy of the data.** An artist who joins on their phone is visible only on that phone, and a booking is not seen by the artist.
- **There are no accounts, payments or notifications.** Prices and the booking fee are calculated and shown, but no money moves.

To run Ruartist as a real marketplace, the next step is a shared backend: accounts and a database (for example Supabase or Firebase), audio-file uploads, and payments with a split payout to artists (for example Razorpay Route). The screens and the ranking logic stay as they are. Only `loadState` and `saveState` in `src/logic.js`, and the publish and booking handlers in `src/App.jsx`, need to call that backend.
