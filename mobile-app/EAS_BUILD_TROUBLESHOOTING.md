# EAS Build – "Build request failed" / "build command failed"

## 1. Use the latest EAS CLI

Run builds with the latest CLI so the client matches EAS servers:

```bash
npx eas-cli@latest build --platform android --profile production
```

Or update the global CLI and run as usual:

```bash
npm install -g eas-cli@latest
eas build --platform android --profile production
```

## 2. Get the real error from the build

The message **"Build request failed. Error: build command failed"** is generic. The actual failure is in the **build log** on Expo:

1. Open [expo.dev](https://expo.dev) and sign in.
2. Go to your project → **Builds**.
3. Open the **failed** build.
4. Open the **build log** and expand the failed step (e.g. "Install dependencies", "Run prebuild", "Run gradle") to see the exact error.

## 3. Optional: run with verbose logging

To see more detail in your terminal:

```bash
npx eas-cli@latest build --platform android --profile production --verbose
```

## 4. Check Expo status

If many builds are failing, check:

- [Expo Status](https://status.expo.dev)
- [EAS Build status](https://expo.dev/eas-build-status)

## 5. Local build (advanced)

To debug by building on your machine:

```bash
eas build --platform android --profile production --local
```

You need Android SDK / environment set up locally for this.
