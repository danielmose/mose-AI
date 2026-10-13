# Jarvis Web

Chat interface for jarvis-core, with browser-based voice input (Web Speech
API) and voice output (SpeechSynthesis), plus a download section for the
Android companion app.

## Setup

```powershell
npm install
copy .env.example .env
```

Point `VITE_JARVIS_API_URL` in `.env` at wherever jarvis-core is running.

## Run

```powershell
npm run dev
```

## Android APK download link

The "Download APK" button links to `/jarvis.apk`. To make it work:

1. Build the APK from the `jarvis-android` project (see its README).
2. Copy the resulting `.apk` file into this project's `public/` folder as
   `jarvis.apk`.
3. Rebuild (`npm run build`) and deploy.

Browsers will warn users that installing APKs from outside the Play Store
requires enabling "install from this source" — that's normal Android
behavior, not something to work around.
