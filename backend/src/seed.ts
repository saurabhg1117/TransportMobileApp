import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { getStore } from './lib/store/index.js';
import { createUser, getUserByUsername } from './repositories/userRepo.js';
import { getSettings } from './repositories/settingsRepo.js';

/**
 * Idempotent bootstrap: ensures the store/sheets exist, a Super Admin account is
 * present, and a default settings row is created. Safe to run multiple times.
 */
async function seed(): Promise<void> {
  const store = await getStore();
  console.log(`Initializing data store: ${store.kind}`);

  await getSettings();
  console.log('Ensured transporter settings row.');

  const existing = await getUserByUsername(config.superAdmin.username);
  if (existing) {
    console.log(`Super Admin "${config.superAdmin.username}" already exists. Skipping.`);
  } else {
    const passwordHash = await bcrypt.hash(config.superAdmin.password, config.bcryptRounds);
    const admin = await createUser({
      name: config.superAdmin.name,
      username: config.superAdmin.username,
      passwordHash,
      role: 'SUPER_ADMIN',
    });
    console.log(`Created Super Admin: ${admin.username} (id: ${admin.id})`);
    console.log(`  Password: ${config.superAdmin.password}  <-- change this after first login`);
  }

  console.log('Seed complete.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
