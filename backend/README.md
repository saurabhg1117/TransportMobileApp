# TPSMS Backend

Backend API for the **Transport Payment Slip Management System**.

- **Runtime:** Node.js + Express 5 (TypeScript, ESM)
- **Auth:** JWT (Bearer) + bcrypt password hashing
- **Storage:** Google Sheets (primary). Falls back to a local JSON file when Google
  credentials are not configured, so you can run it immediately.

## Quick start

```bash
cd backend
npm install
cp .env.example .env        # (Windows: copy .env.example .env)
npm run seed                # creates the Super Admin + initializes tables
npm run dev                 # starts http://localhost:5000
```

By default (no Google credentials) data is written to `data/transport-data.json`.

### Default Super Admin

Set in `.env` (`SUPER_ADMIN_*`). Defaults:

- username: `admin`
- password: `admin123`

Change the password after first login via `POST /api/auth/change-password`.

## Google Sheets setup (primary store)

### 1. Google Cloud (one-time)

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. **APIs & Services → Library** → enable **Google Sheets API**
4. **IAM & Admin → Service Accounts** → **Create service account** (any name, e.g. `tpsms`)
5. Open the service account → **Keys** → **Add key → JSON** → download the `.json` file  
   (keep this private — do not commit it to git)

### 2. Google Spreadsheet

1. Create a new [Google Spreadsheet](https://sheets.google.com)
2. Click **Share** and add the service account email from the JSON file  
   (`client_email`, looks like `something@project-id.iam.gserviceaccount.com`)
3. Give it **Editor** access
4. Copy the spreadsheet id from the URL:  
   `https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`

### 3. Configure the backend (Windows)

In PowerShell, from the `backend` folder:

```powershell
cd backend
npm run sheets:configure -- "C:\path\to\your-service-account.json" YOUR_SPREADSHEET_ID
```

This writes `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` into `.env`.

### 4. Migrate existing local data (optional)

If you already have data in `data/transport-data.json`:

```powershell
npm run sheets:migrate
npm run seed
npm run sheets:verify
npm run dev
```

`sheets:migrate` copies users, settings, slips, and audit logs into the sheet (skips duplicate ids if re-run).

### 5. Verify

```powershell
npm run sheets:verify
```

You should see row counts for `Users`, `TransporterSettings`, `PaymentSlips`, and `AuditLogs`.

When all three `GOOGLE_*` values are present the backend uses Google Sheets;
otherwise it uses the local JSON file at `DATA_FILE`.

## Data model (tables / sheets)

- **Users** — `id, name, username, passwordHash, role, status, mobile, createdAt, updatedAt`
- **TransporterSettings** — company + branding + slip config (single row)
- **PaymentSlips** — full slip record (vehicle, route, cargo, payment breakdown)
- **AuditLogs** — `id, userId, username, action, entity, entityId, details, createdAt`

## API

All protected routes expect `Authorization: Bearer <token>`.

### Auth

| Method | Path                         | Access        | Notes |
| ------ | ---------------------------- | ------------- | ----- |
| POST   | `/api/auth/login`            | public        | `{ username, password }` -> `{ token, user }` |
| GET    | `/api/auth/me`               | any user      | current user |
| POST   | `/api/auth/change-password`  | any user      | `{ currentPassword, newPassword }` |
| POST   | `/api/auth/forgot-password`  | public        | logs a reset request for the admin |

### Drivers (Super Admin only)

| Method | Path                        | Notes |
| ------ | --------------------------- | ----- |
| GET    | `/api/drivers`              | list drivers |
| GET    | `/api/drivers/:id`          | single driver |
| POST   | `/api/drivers`              | `{ name, username, password, mobile?, status? }` |
| PUT    | `/api/drivers/:id`          | edit; include `password` to reset it |
| PATCH  | `/api/drivers/:id/access`   | `{ grant: boolean }` grant/revoke access |
| DELETE | `/api/drivers/:id`          | delete driver |

### Company settings

| Method | Path            | Access        | Notes |
| ------ | --------------- | ------------- | ----- |
| GET    | `/api/settings` | any user      | branding/company config |
| PUT    | `/api/settings` | Super Admin   | update company + branding + slip config |

### Payment slips

| Method | Path                      | Access                         | Notes |
| ------ | ------------------------- | ------------------------------ | ----- |
| GET    | `/api/payment-slips`      | admin: all / driver: own       | list |
| GET    | `/api/payment-slips/:id`  | owner or admin                 | single |
| POST   | `/api/payment-slips`      | any user                       | auto slip number if enabled |
| PUT    | `/api/payment-slips/:id`  | owner or admin                 | edit; balance recomputed |
| DELETE | `/api/payment-slips/:id`  | owner or admin                 | delete |

**Balance** is auto-computed as `freight - (advance + cash + diesel + bank + commission + missing)`
unless an explicit `balance` is supplied.

## Scripts

- `npm run dev` — hot-reload dev server (`tsx` + `nodemon`)
- `npm run build` — compile to `dist/`
- `npm start` — run compiled server
- `npm run seed` — initialize store + create Super Admin
- `npm run sheets:configure` — write Google credentials into `.env` from a JSON key file
- `npm run sheets:migrate` — copy `data/transport-data.json` into Google Sheets
- `npm run sheets:verify` — test Sheets connection and show row counts
- `npm run typecheck` — type-check without emitting

## Not yet implemented (see SRS roadmap)

PDF generation, reports/exports, and an explicit Google Sheets "sync" endpoint
(writes already land in Sheets when configured) are planned next phases.
