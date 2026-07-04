import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { config, useGoogleSheets } from './config.js';
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

app.get('/health', async (_req: Request, res: Response) => {
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
