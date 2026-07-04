# TPSMS Mobile

Expo React Native app for the **Transport Payment Slip Management System**.

- **Framework:** Expo (SDK 55) + React Native, TypeScript
- **Navigation:** React Navigation (native stack)
- **State/auth:** JWT stored in AsyncStorage, axios client with auth interceptor
- **PDF/Print:** `expo-print` + `expo-sharing` (fully client-side slip PDF)

## Prerequisites

Start the backend first (see `../backend/README.md`):

```bash
cd ../backend
npm run seed
npm run dev      # http://localhost:5000
```

## Run the app

```bash
cd mobile
npm install
npm start        # then press: w (web), a (Android), i (iOS)
```

### Pointing the app at your backend

`src/config.ts` chooses a sensible default automatically:

- **Web / iOS simulator:** `http://localhost:5000/api`
- **Android emulator:** `http://10.0.2.2:5000/api`

On a **physical device**, set your computer's LAN IP via an env var before starting:

```bash
# PowerShell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.5:5000/api"; npm start
```

## Screens

| Screen              | Role        | Purpose |
| ------------------- | ----------- | ------- |
| Login               | public      | username/password sign-in, forgot-password request |
| Dashboard           | all         | role-aware hub with quick stats and navigation tiles |
| Payment Slips       | all         | list + search (drivers see own, admin sees all) |
| Create / Edit Slip  | all         | full slip form with live balance calculation |
| Slip Preview        | all         | formatted slip + **Print** and **PDF/Share** |
| Driver Management   | admin       | create/edit drivers, reset password, grant/revoke, delete |
| Company Settings    | admin       | company info, address, branding, slip config, terms |
| Profile             | all         | account details, change password, logout |

## Notes

- The **balance** shown while creating a slip mirrors the backend rule:
  `freight − (advance + cash + diesel + bank + commission + missing)`.
- Slip numbers auto-generate when "Auto slip numbering" is enabled in Company Settings
  (leave the slip-number field blank on creation).
- PDF generation is done on-device from an HTML template (`src/slip.ts`), so it works
  without any backend PDF service.

## Scripts

- `npm start` — Expo dev server
- `npm run android` / `npm run ios` / `npm run web`
- `npm run typecheck` — TypeScript check
