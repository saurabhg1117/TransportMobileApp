# Deploy TPSMS — always on (24/7)

Keep **backend**, **mobile web**, and **Google Sheets** reachable all the time.

> **No credit card?** Oracle Cloud requires a card even for free tier.  
> Use **[deploy/NO-CREDIT-CARD.md](deploy/NO-CREDIT-CARD.md)** (Home PC + Cloudflare)  
> or **[deploy/BELMO-NETLIFY-APK.md](deploy/BELMO-NETLIFY-APK.md)** (Belmo + Netlify + APK).

| Component | Always on? | How |
|-----------|------------|-----|
| **Google Sheet** | Yes (24/7) | Google cloud — no action needed |
| **Mobile web** | Yes (24/7) | Static files on CDN (Netlify) or nginx on VPS |
| **Backend API** | Needs right host | Free Render **sleeps** — use VPS or paid plan |

---

## Recommended: Option A — Free VPS (requires credit card on Oracle)

> **Skip this if you don't want to enter payment details.**  
> See [deploy/NO-CREDIT-CARD.md](deploy/NO-CREDIT-CARD.md).

**Step-by-step Oracle Cloud guide:** [deploy/ORACLE-VPS.md](deploy/ORACLE-VPS.md)

### 1. Create a free always-on VPS

[Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/) → Create an **Ampere ARM** VM (Ubuntu 22.04).

- 4 GB RAM, always free, never sleeps
- Open port **80** in the security list (ingress rule)

Alternatives: Hetzner (~€4/mo), DigitalOcean ($6/mo).

### 2. Push code to the server

```bash
# On your PC — copy project + .env to the server
scp -r TransportMobileApp user@SERVER_IP:~/
scp backend/.env user@SERVER_IP:~/TransportMobileApp/backend/.env
```

### 3. Start the stack (one command)

```bash
# SSH into the server
ssh user@SERVER_IP
cd ~/TransportMobileApp
chmod +x deploy/vps-setup.sh
./deploy/vps-setup.sh
```

This runs `docker compose up -d --build` with **`restart: always`**:
- **api** — Node backend → Google Sheets
- **web** — nginx serves mobile app + proxies `/api` to backend

### 4. Use the app

Open in browser: `http://SERVER_IP`

- Login, slips, settings — all live
- Data writes go to your Google Sheet instantly
- Containers restart automatically if the server reboots

### 5. Optional: custom domain + HTTPS

Point a domain to the server IP, then add Caddy or Certbot for SSL.

---

## Option B — Paid managed (easiest, ~$7/mo)

No server admin. Backend never sleeps.

| Part | Service | Plan |
|------|---------|------|
| API | [Render](https://render.com) | **Starter** ($7/mo) — not Free |
| Web | [Netlify](https://netlify.com) | Free (always on CDN) |
| Data | Google Sheets | Free |

### Backend (Render Starter — always on)

1. New **Web Service** → root dir `backend`
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Plan: **Starter** (not Free — Free sleeps after 15 min)
5. Env vars: `JWT_SECRET`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`

Test: `https://YOUR-APP.onrender.com/health`

### Web (Netlify — always on)

1. Import repo → base dir `mobile`
2. Build: `npm install && npx expo export --platform web`
3. Publish: `dist`
4. Env: `EXPO_PUBLIC_API_URL=https://YOUR-APP.onrender.com/api`
5. On Render set `CORS_ORIGIN=https://YOUR-SITE.netlify.app`

---

## Option C — Fly.io backend (~$5/mo)

Always-on API with `min_machines_running = 1` (see `backend/fly.toml`).

```bash
cd backend
fly launch
fly secrets set JWT_SECRET=... GOOGLE_SHEET_ID=... GOOGLE_SERVICE_ACCOUNT_EMAIL=... GOOGLE_PRIVATE_KEY=...
fly deploy
```

Use Netlify for mobile web (same as Option B step 3).

---

## What stays active when

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Mobile Web     │────▶│  Backend API     │────▶│  Google Sheet   │
│  (nginx/Netlify)│     │  (VPS/Render/Fly)│     │  (always 24/7)  │
│  always on      │     │  must not sleep  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

- **Google Sheet** — always active (Google hosts it)
- **Mobile web** — always active on Netlify CDN or your VPS nginx
- **Backend** — only always active on VPS, Render **Starter**, or Fly with min 1 machine

---

## Do NOT use for 24/7

| Setup | Problem |
|-------|---------|
| Render **Free** plan | Sleeps after ~15 min idle, 30–60s wake delay |
| Local PC (`npm run dev`) | Stops when PC is off |
| Ping/cron keep-alive only | Unreliable; Render may still sleep |

---

## Security checklist

- [ ] Strong `JWT_SECRET` in production
- [ ] Change admin password after first login
- [ ] Never commit `.env` or service account JSON
- [ ] Google Sheet shared only with service account email
- [ ] Set `CORS_ORIGIN` to your real web URL (when using split hosting)

---

## Quick commands

```bash
# Local test of production stack
docker compose up --build

# VPS status
docker compose ps
docker compose logs -f api

# Rebuild after code update
git pull && docker compose up -d --build
```

---

## Phone app (optional)

Build Android APK with production API URL:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://YOUR-API-URL/api npx eas build --platform android
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App can't reach API | Check `EXPO_PUBLIC_API_URL` or nginx `/api` proxy |
| 403 / health fails | Verify `GOOGLE_*` env vars; sheet shared with service account |
| Slow after idle | You're on Render Free — upgrade to Starter or use VPS |
| Docker won't start | Ensure `backend/.env` exists on the server |
