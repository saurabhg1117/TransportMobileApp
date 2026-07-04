# Deploy without credit card (24/7)

Oracle Cloud **always asks for a credit card** (even on free tier). Use one of these instead — **no payment details required**.

| Component | Always on? | No credit card? |
|-----------|------------|-----------------|
| Google Sheet | Yes | Yes (you already have this) |
| Mobile web | Yes | Yes — Netlify or Cloudflare |
| Backend API | Yes | Yes — see options below |

---

## Option 1 — Home PC + Cloudflare Tunnel (recommended, $0)

Run the app on **your Windows PC** at home/office (leave it on). Use **Cloudflare Tunnel** to get a free public HTTPS link — no credit card, no port forwarding.

### What you need
- Your Windows PC on 24/7 (or office hours)
- Internet connection
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Free [Cloudflare account](https://dash.cloudflare.com/sign-up) — **no credit card**

### Step 1 — Install Docker Desktop
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Install → restart PC → open Docker Desktop → wait until it says **Running**

### Step 2 — Start TPSMS locally in Docker

PowerShell:

```powershell
cd "C:\Users\saura\OneDrive\Desktop\TransportMobileApp"
docker compose up -d --build
```

Wait ~10 min first time. Test locally: http://localhost

### Step 3 — Install Cloudflare Tunnel

```powershell
winget install Cloudflare.cloudflared
```

### Step 4 — Quick public URL (easiest, no account setup)

```powershell
cloudflared tunnel --url http://localhost:80
```

Copy the `https://xxxx.trycloudflare.com` URL — share this with drivers/admin.  
**Note:** URL changes each time you restart the tunnel. Good for testing.

### Step 5 — Permanent URL (free Cloudflare account)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up) — no credit card
2. Run:

```powershell
cloudflared tunnel login
cloudflared tunnel create tpsms
cloudflared tunnel route dns tpsms tpsms.YOURDOMAIN.com
```

If you don't own a domain, keep using the **quick tunnel** from Step 4, or get a free subdomain service.

3. Create config file `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: tpsms
credentials-file: C:\Users\YOUR_USER\.cloudflared\TUNNEL_ID.json

ingress:
  - hostname: tpsms.YOURDOMAIN.com
    service: http://localhost:80
  - service: http_status:404
```

4. Run as Windows service (starts on boot):

```powershell
cloudflared service install
cloudflared service start
```

### Keep PC awake
- Windows Settings → Power → **Never sleep** when plugged in
- Disable automatic restarts during work hours

---

## Option 2 — Belmo (backend) + Netlify (web) + APK — $0, no card

**Full guide:** [deploy/BELMO-NETLIFY-APK.md](deploy/BELMO-NETLIFY-APK.md)

Host backend and web in the cloud, plus build an installable Android APK.

### A. Backend on Belmo (always on, no sleep)

1. Push project to **GitHub** (don't commit `.env`)
2. Go to [belmo.io](https://belmo.io) → Sign up (GitHub) — no credit card
3. **New service** → connect repo
   - **Root directory:** `backend`
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`
4. **Environment variables** (from your `backend/.env`):
   - `JWT_SECRET`
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. Deploy → copy URL e.g. `https://tpsms-api.belmo.app`
6. Test: `https://YOUR-URL/health`

### B. Mobile web on Netlify (always on CDN)

1. [netlify.com](https://netlify.com) → Sign up (GitHub) — no credit card
2. **Add site** → Import repo
   - **Base directory:** `mobile`
   - **Build:** `npm install && npx expo export --platform web`
   - **Publish:** `dist`
3. **Environment variable:**
   ```
   EXPO_PUBLIC_API_URL=https://YOUR-BELMO-URL/api
   ```
4. Deploy → open your Netlify URL

### C. Lock CORS on Belmo

Add env var on Belmo:
```
CORS_ORIGIN=https://YOUR-SITE.netlify.app
```

---

## Option 3 — JustRunMy.App (zip upload, no Git)

1. [justrunmy.app](https://justrunmy.app) — sign up, **no credit card**
2. Zip the `backend` folder (include `package.json`, `src`, `tsconfig.json` — not `node_modules`)
3. Upload zip → set port **5000** → add env vars
4. Use Netlify for mobile (same as Option 2B)

> Free tier is small (0.25 GB RAM). Fine for a few users; upgrade if slow.

---

## Comparison

| Option | Credit card? | 24/7 | Best for |
|--------|--------------|------|----------|
| **Home PC + Cloudflare** | No | Yes (if PC stays on) | Small team, one office |
| **Belmo + Netlify** | No | Yes | Access from anywhere, no PC |
| **Oracle Cloud VPS** | **Yes** (required) | Yes | Skip if no card |
| **Render Free** | Sometimes | No (sleeps) | Not recommended |

---

## What stays active

```
Option 1 (Home PC):
  PC (Docker) ──▶ Cloudflare Tunnel ──▶ Internet
                      │
                      └──▶ Google Sheets (24/7)

Option 2 (Belmo + Netlify):
  Netlify (web) ──▶ Belmo (API) ──▶ Google Sheets (24/7)
```

---

## Quick start (no card, fastest)

**If you have a PC that can stay on:**

```powershell
# 1. Start app
cd "C:\Users\saura\OneDrive\Desktop\TransportMobileApp"
docker compose up -d --build

# 2. Public link (copy the https URL shown)
cloudflared tunnel --url http://localhost:80
```

Share that URL with your team. Login: `admin` / `admin123` — change password after first login.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Docker won't start | Enable WSL2 / virtualization in BIOS |
| `localhost` works, tunnel doesn't | Re-run `cloudflared tunnel --url http://localhost:80` |
| Belmo build fails | Check root dir is `backend`, Node 20+ |
| Netlify can't reach API | `EXPO_PUBLIC_API_URL` must end with `/api` |
| Google Sheets 403 | Sheet shared with service account email |
