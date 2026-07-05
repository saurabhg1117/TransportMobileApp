# Update without reinstalling the APK

## How it works

| What you change | What to do | Reinstall APK? |
|-----------------|------------|----------------|
| **Backend** (API, Google Sheets logic) | `git push` → Belmo redeploys | **No** — app already calls live API |
| **Web app** (Netlify) | `git push` → Netlify redeploys | N/A (browser) |
| **Mobile UI / screens / JS** | `git push` then `npm run update:apk` | **No** — OTA update on next app open |
| **New native package** (e.g. camera) | `npm run build:apk` | **Yes** — one new install |
| **App version** in `app.json` | `npm run build:apk` | **Yes** |

The installed APK talks to **https://transportmobileapp-b45c.onbelmo.uk/api** — backend changes apply immediately.

Mobile JS changes use **Expo EAS Update** (over-the-air). The app checks for updates every time it opens.

---

## One-time: install the OTA-enabled APK

Your current APK was built **before** OTA was enabled. Rebuild **once**:

```powershell
cd mobile
npm run build:apk
```

Install the new APK from the Expo link. After this, you rarely need to reinstall.

---

## Day-to-day workflow

### Backend change

```powershell
git add .
git commit -m "your message"
git push
```

Belmo picks up `main` and redeploys (~2 min). Open the app — no reinstall.

### Mobile change (screens, styling, logic)

```powershell
git push
cd mobile
npm run update:apk
```

Users get the update when they **close and reopen** the app (or it reloads automatically if an update was found on launch).

### Web change

```powershell
git push
```

Netlify rebuilds automatically.

---

## Optional: auto-push mobile updates on git push

1. Expo → [Account settings → Access tokens](https://expo.dev/accounts/saurabhg1117/settings/access-tokens) → create token
2. GitHub repo → **Settings → Secrets → Actions** → add `EXPO_TOKEN`
3. Push includes `.github/workflows/mobile-ota.yml` — updates publish on every push to `mobile/`

---

## When you MUST rebuild the APK

- Added/removed a native Expo module
- Changed `version` in `mobile/app.json` (runtime version policy)
- Changed Android permissions or `app.json` plugins

```powershell
cd mobile
npm run build:apk
```
