import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { config, useGoogleSheets, getGoogleConfigStatus } from './config.js';
import { getStore } from './lib/store/index.js';
import authRoutes from './routes/authRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import slipRoutes from './routes/slipRoutes.js';

const app = express();

app.use(
  cors(
    config.corsOrigins.length > 0
      ? { origin: config.corsOrigins, credentials: true }
      : undefined,
  ),
);
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'TPSMS backend is running', version: '1.0.0' });
});

/** Fast liveness probe — must return 200 quickly for Belmo/HostingGuru routing. */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    storeConfigured: useGoogleSheets,
  });
});

/** Readiness probe — verifies the data store (Google Sheets) is reachable. */
app.get('/ready', async (_req: Request, res: Response) => {
  if (process.env['NODE_ENV'] === 'production' && config.google.sheetId && !useGoogleSheets) {
    const { missing } = getGoogleConfigStatus();
    res.status(503).json({
      status: 'error',
      error: 'Google Sheets credentials not configured',
      missing,
      hint: 'Add GOOGLE_SERVICE_ACCOUNT_JSON_B64 in Belmo → Environment, then Redeploy',
    });
    return;
  }

  try {
    const store = await getStore();
    res.json({ status: 'ok', store: store.kind });
  } catch (err) {
    res.status(500).json({ status: 'error', error: (err as Error).message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/payment-slips', slipRoutes);

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found.' });
});

async function start(): Promise<void> {
  app.listen(config.port, () => {
    console.log(`TPSMS backend running on http://localhost:${config.port}`);
  });

  // Init store after listen so hosting health checks pass even if Sheets creds are wrong.
  try {
    const store = await getStore();
    console.log(`Data store: ${store.kind}${useGoogleSheets ? '' : ' (local fallback)'}`);
  } catch (err) {
    console.error('Data store init failed (API will return errors until fixed):', err);
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
