# Jarvis Android

Companion app for jarvis-core. Real, complete Kotlin source — this needs to
be built in Android Studio to produce an installable APK; it wasn't
compiled here because doing so requires the Android SDK/Gradle toolchain
reaching Google's servers, which isn't available in the sandbox this was
built in.

## Build it

1. Install [Android Studio](https://developer.android.com/studio).
2. Open this `jarvis-android` folder as a project (File > Open).
3. Let Gradle sync (first run downloads the SDK/build tools and Gradle
   8.7 itself — needs internet access, and the `gradlew` wrapper scripts
   will be regenerated automatically by Android Studio if missing).
4. If Android Studio flags the Android Gradle Plugin (8.5.2) or Kotlin
   (1.9.24) version as outdated for your installed Studio version, accept
   its offered upgrade — these were the current stable versions when this
   was written and newer Studio releases may expect newer ones.
5. Edit `JarvisApi.kt` and change `BASE_URL` to wherever you're running
   jarvis-core:
   - `http://10.0.2.2:3000` — works out of the box if testing in the
     Android emulator and jarvis-core is running on your own machine.
   - Your machine's LAN IP (e.g. `http://192.168.1.20:3000`) — for testing
     on a physical phone on the same Wi-Fi.
   - A real deployed URL — once you've hosted jarvis-core somewhere
     reachable from the internet.
6. Build > Generate Signed Bundle / APK, or just Run on a connected device
   for testing.

The resulting `app-release.apk` (or debug APK) is what you'd copy into
`jarvis-web/public/jarvis.apk` so the website's download button serves it.

## Permission model

Every capability here requires the phone's own owner to grant it through
Android's own system screens, launched from the in-app Permissions screen:

- **Microphone** — standard runtime permission dialog.
- **Lock screen control** — Device Admin, granted via Android's
  "Activate this device admin app?" screen, which shows exactly what it
  can do (`force-lock` only — nothing else is requested).

Nothing is granted automatically, silently, or on someone else's phone.

## What it can and can't do

- **Open an app** — via `PackageManager`, once the app is installed.
- **Lock the screen** — via `DevicePolicyManager.lockNow()`, once device
  admin is active.
- **Unlock the screen** — not implemented, because it isn't possible.
  Android does not let any app, regardless of permissions, bypass the lock
  screen without the owner entering their own PIN/pattern/biometric. This
  is a deliberate OS security boundary.

## Adding more actions

1. Add a new client tool in `jarvis-core/src/skills/device.js` (schema
   only, no `run`).
2. Add a matching `when` branch in `DeviceActions.kt` that performs it
   using whatever Android API/permission it needs.
3. If it needs a new permission, add a row to `PermissionsScreen.kt`.
