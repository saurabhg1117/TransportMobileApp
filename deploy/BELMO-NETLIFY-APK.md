# Belmo + Netlify + Android APK

Deploy **backend** (Belmo), **web app** (Netlify), and build an **installable APK** — no credit card for Belmo/Netlify.

| Part | Where | Install / access |
|------|--------|------------------|
| API | Belmo | Always on, HTTPS |
| Web | Netlify | Browser link |
| Android | EAS Build | `.apk` file on phone |
| Data | Google Sheets | 24/7 |

---

## Part 1 — Push code to GitHub

1. Create a repo on [github.com](https://github.com) (e.g. `TransportMobileApp`)
2. Push your project — **do not commit**:
   - `backend/.env`
   - `*service-account*.json`
   - `node_modules/`

```powershell
cd "C:\Users\saura\OneDrive\Desktop\TransportMobileApp"
git init
git add .
git commit -m "TPSMS initial"
git remote add origin https://github.com/YOUR_USER/TransportMobileApp.git
git push -u origin main
```

---

## Part 2 — Deploy backend on Belmo

1. Go to [belmo.io](https://belmo.io) → **Sign up with GitHub** (no credit card)
2. **New service** → select your repo
3. Settings:

   | Setting | Value |
   |---------|--------|
   | Root directory | `backend` |
   | Build command | `npm install && npm run build` |
   | Start command | `npm start` |
   | Node version | 20 or 22 |

4. **Environment variables** (copy from your local `backend/.env`):

   | Key | Example |
   |-----|---------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | long random string (new, not dev default) |
   | `GOOGLE_SHEET_ID` | `1otvWmNDE5zJCWwVN_mu9B1bNZ_sy-rCIz1NyWlbOHvk` |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `tpsms-965@tpsms-501417.iam.gserviceaccount.com` |
   | `GOOGLE_PRIVATE_KEY` | paste full key from JSON file (multiline OK) |

5. **Deploy** → wait for green status
6. Copy your Belmo URL, e.g. `https://tpsms-api-xxxxx.belmo.app`
7. Test: open `https://YOUR-BELMO-URL/health` → should show `"store":"google-sheets"`

**Save this URL** — you need it for Netlify and APK.

---

## Part 3 — Deploy web app on Netlify

1. Go to [netlify.com](https://netlify.com) → **Sign up with GitHub** (no credit card)
2. **Add new site** → **Import an existing project** → your repo
3. Settings:

   | Setting | Value |
   |---------|--------|
   | Base directory | `mobile` |
   | Build command | `npm install && npx expo export --platform web` |
   | Publish directory | `mobile/dist` |

4. **Environment variables** → **Add**:

   ```
   EXPO_PUBLIC_API_URL = https://YOUR-BELMO-URL/api
   ```

   Replace with your real Belmo URL from Part 2.

5. **Deploy site**
6. Copy Netlify URL, e.g. `https://tpsms.netlify.app`

### Lock down API (optional but recommended)

On Belmo → Environment → add:

```
CORS_ORIGIN=https://YOUR-SITE.netlify.app
```

Redeploy Belmo. (Android APK does not need CORS — only the web app does.)

---

## Part 4 — Build Android APK

The APK talks directly to your Belmo API (HTTPS). No credit card for Expo account.

### Step 1 — Update API URL in eas.json

Edit `mobile/eas.json` — replace `YOUR-BELMO-URL` with your real Belmo host:

```json
"EXPO_PUBLIC_API_URL": "https://tpsms-api-xxxxx.belmo.app/api"
```

### Step 2 — Create Expo account & link project

```powershell
cd "C:\Users\saura\OneDrive\Desktop\TransportMobileApp\mobile"
npx eas-cli login
npx eas-cli init
```

`eas init` creates a project on expo.dev and adds `projectId` to `app.config.ts` / `app.json`.

### Step 3 — Build APK (cloud build, ~10–20 min)

```powershell
npm run build:apk
```

Or:

```powershell
npx eas-cli build --platform android --profile preview
```

- First time: EAS asks to generate Android keystore → choose **Yes** (let Expo manage it)
- Build runs on Expo servers (free tier: limited builds/month)
- When done, you get a **download link** for the `.apk`

### Step 4 — Install on phone

1. Open the APK download link on your Android phone (or download on PC and transfer)
2. Tap the file → **Install**
3. If blocked: Settings → **Install unknown apps** → allow your browser/files app
4. Open **TPSMS** → login `admin` / `admin123` → change password

---

## Part 5 — After go-live

- [ ] Change admin password
- [ ] Test login on web (Netlify) and APK
- [ ] Create driver accounts from admin
- [ ] Confirm new slips appear in Google Sheet

---

## Updating later

| Change | Action |
|--------|--------|
| Backend code | Push to GitHub → Belmo auto-redeploys |
| Web UI | Push to GitHub → Netlify auto-redeploys |
| Mobile APK | Update `eas.json` if API URL changed → `npm run build:apk` again |
| API URL only | Update Belmo/Netlify env vars; rebuild APK if native app |

---

## Quick reference

```text
Belmo API:    https://YOUR-BELMO-URL/api
Netlify web:  https://YOUR-SITE.netlify.app
APK:          eas build → download link
Google Sheet: 4 tabs (Users, Settings, Slips, Audit)
Login:        admin / admin123 (change immediately)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| APK "Cannot reach server" | `eas.json` must have correct `EXPO_PUBLIC_API_URL` ending in `/api`; rebuild APK |
| Web works, APK doesn't | APK uses URL baked at build time — rebuild after fixing `eas.json` |
| Belmo health fails | Check `GOOGLE_*` env vars; sheet shared with service account |
| Netlify build fails | Base dir `mobile`, publish `dist`, Node 22 |
| EAS build fails | Run `npx eas-cli init` first; Expo account required (free) |
| Install blocked on Android | Enable "Install unknown apps" for file manager |

---

## Costs

| Service | Cost | Credit card |
|---------|------|-------------|
| Belmo Starter | Free (1 service) | No |
| Netlify | Free | No |
| Expo EAS Build | Free tier (limited builds) | No |
| Google Sheets | Free | No |
