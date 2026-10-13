# Jarvis

A personal assistant with one shared brain and three interfaces.

```
jarvis-core/      Node.js API — Claude-powered reasoning, memory, skills.
                   Every interface talks to this.
jarvis-web/        React chat UI with browser voice (Web Speech API),
                   plus the site's "Download for Android" section.
jarvis-android/    Android Studio project (Kotlin). Real source, not a
                   compiled APK — see its README for why and how to build.
```

## Get it running (in this order)

**1. jarvis-core**
```powershell
cd jarvis-core
npm install
copy .env.example .env
# add your ANTHROPIC_API_KEY to .env
npm run dev
```

**2. jarvis-web**
```powershell
cd jarvis-web
npm install
copy .env.example .env
npm run dev
```
Open the URL it prints. Chat and voice work immediately against jarvis-core.

**3. jarvis-android** (optional, for phone control)
Open `jarvis-android/` in Android Studio, point `JarvisApi.kt` at your
running jarvis-core, and build. Its README covers the permission model in
detail — every capability is granted by the phone's own owner through
Android's own dialogs, and unlocking the phone isn't something any app can
do (not a limitation of this one, an Android security boundary).

Once you've built an APK, drop it into `jarvis-web/public/jarvis.apk` and
the website's download button will serve it.

## Adding skills

- **Server-side** (runs on jarvis-core: search, home automation, anything
  that doesn't need to touch the phone itself) — add a file to
  `jarvis-core/src/skills/`, see `time.js` for the pattern.
- **Device-side** (runs on the phone: opening apps, anything requiring an
  Android permission) — add to `jarvis-core/src/skills/device.js` and
  `jarvis-android/.../DeviceActions.kt`, see the existing `open_app` /
  `lock_device` pair for the pattern.

## Configured skills

- `web_search` — no API key needed, uses DuckDuckGo's HTML endpoint.
- `control_home_device` — needs `HOME_ASSISTANT_URL` and
  `HOME_ASSISTANT_TOKEN` in `jarvis-core/.env` if you use Home Assistant.
- `open_app`, `lock_device` — Android only, needs the app installed and
  permissions granted on that phone.
