# Oracle Cloud Free VPS — TPSMS 24/7 deploy

Run **backend + mobile web + Google Sheets** on one always-on server ($0/month).

---

## Part 1 — Create Oracle Cloud account & VM (~20 min)

### 1. Sign up
1. Go to [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Create account (credit card for verification — **not charged** on free tier)

### 2. Create a VM instance
1. Console → **Compute** → **Instances** → **Create instance**
2. Settings:

   | Setting | Value |
   |---------|--------|
   | Name | `tpsms-server` |
   | Image | **Ubuntu 22.04** (or 24.04) |
   | Shape | **Ampere** → `VM.Standard.A1.Flex` |
   | OCPUs | `1` |
   | Memory (GB) | `6` |
   | Boot volume | 50 GB (default is fine) |

3. **Networking** — use default VCN or create new (both work)
4. **Add SSH keys** — click **Generate a key pair** → download:
   - `ssh-key-YYYY-MM-DD.key` (private — keep safe)
   - `ssh-key-YYYY-MM-DD.key.pub` (public)
5. **Create** → wait until state is **Running**
6. Copy the **Public IP address** (e.g. `129.146.xxx.xxx`)

### 3. Open firewall ports (important!)
Oracle blocks traffic until you open ports in the **Security List**.

1. On the instance page → click your **Subnet** link
2. Click the **Security List** (default)
3. **Add Ingress Rules** — add **two** rules:

   **Rule 1 — SSH**
   | Field | Value |
   |-------|--------|
   | Source CIDR | `0.0.0.0/0` |
   | IP Protocol | TCP |
   | Destination port | `22` |

   **Rule 2 — Web app**
   | Field | Value |
   |-------|--------|
   | Source CIDR | `0.0.0.0/0` |
   | IP Protocol | TCP |
   | Destination port | `80` |

4. Save rules

---

## Part 2 — Upload project from your Windows PC

### Option A — PowerShell script (recommended)

On your PC, in PowerShell:

```powershell
cd "C:\Users\saura\OneDrive\Desktop\TransportMobileApp"
.\deploy\upload-to-vps.ps1 -ServerIP "YOUR_PUBLIC_IP" -SshKey "C:\path\to\ssh-key.key"
```

Replace `YOUR_PUBLIC_IP` with the Oracle VM IP.

### Option B — Manual steps

```powershell
# 1. Create zip (excludes node_modules)
cd "C:\Users\saura\OneDrive\Desktop"
Compress-Archive -Path TransportMobileApp -DestinationPath tpsms.zip -Force

# 2. Upload zip + .env
scp -i "C:\path\to\ssh-key.key" tpsms.zip ubuntu@YOUR_PUBLIC_IP:~/
scp -i "C:\path\to\ssh-key.key" TransportMobileApp\backend\.env ubuntu@YOUR_PUBLIC_IP:~/

# 3. SSH into server
ssh -i "C:\path\to\ssh-key.key" ubuntu@YOUR_PUBLIC_IP
```

On the server:

```bash
sudo apt-get update && sudo apt-get install -y unzip
unzip -o tpsms.zip
mv .env TransportMobileApp/backend/.env
cd TransportMobileApp
chmod +x deploy/vps-setup.sh
sudo ./deploy/vps-setup.sh
```

---

## Part 3 — Use the app

Open in any browser:

```
http://YOUR_PUBLIC_IP
```

- **Login:** `admin` / `admin123` (change password immediately)
- **Health check:** `http://YOUR_PUBLIC_IP/health` → `"store":"google-sheets"`
- **Data:** live in your Google Sheet (4 tabs)

The server runs **24/7**. Docker containers use `restart: always` — they come back after reboot.

---

## Part 4 — After first login

1. Change admin password (Profile screen)
2. Optionally set a stronger `JWT_SECRET` in `backend/.env` on the server and restart:
   ```bash
   cd ~/TransportMobileApp
   docker compose restart api
   ```

---

## Updating the app later

On your PC — upload again, then on server:

```bash
cd ~/TransportMobileApp
docker compose up -d --build
```

---

## Useful server commands

```bash
# Container status
docker compose ps

# View API logs
docker compose logs -f api

# Restart everything
docker compose restart

# Stop
docker compose down
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't SSH | Check security list allows port 22; correct SSH key path |
| Browser can't open site | Check security list allows port **80**; wait 1–2 min after rules |
| `Permission denied (publickey)` | Use `-i path/to/private.key`; user is `ubuntu` |
| Health shows error | SSH in, run `docker compose logs api` — usually bad `GOOGLE_*` in `.env` |
| Out of memory on build | Use shape with 6 GB RAM; or build on PC and push Docker images |
| Ampere shape unavailable | Try another availability domain, or smaller Flex shape |

---

## Architecture on the VPS

```
Internet
   │
   ▼ port 80
┌──────────────┐      ┌─────────────┐      ┌────────────────┐
│ nginx (web)  │─────▶│ Node API    │─────▶│ Google Sheets  │
│ mobile app   │ /api │ backend     │      │ (cloud 24/7)   │
└──────────────┘      └─────────────┘      └────────────────┘
     restart: always       restart: always
```

---

## Optional: free domain + HTTPS

1. Get a free domain from [Freenom](https://www.freenom.com) or use your own
2. Point DNS A record → Oracle public IP
3. Install Caddy on the server for automatic HTTPS (advanced — ask if you need this)
