import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import {
  createUser,
  deleteUser,
  getUserById,
  getUserByUsername,
  listUsers,
  updateUser,
} from '../repositories/userRepo.js';
import { recordAudit } from '../repositories/auditRepo.js';
import { toPublicUser, type UserStatus } from '../models/types.js';

const router = Router();

// All driver-management endpoints require an authenticated Super Admin.
router.use(authenticate, requireAdmin);

// GET /api/drivers
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const drivers = await listUsers('DRIVER');
  res.json({ drivers: drivers.map(toPublicUser) });
});

// GET /api/drivers/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const driver = await getUserById(req.params['id'] as string);
  if (!driver || driver.role !== 'DRIVER') {
    res.status(404).json({ error: 'Driver not found.' });
    return;
  }
  res.json({ driver: toPublicUser(driver) });
});

// POST /api/drivers
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, username, password, mobile, status } = req.body as {
      name?: string;
      username?: string;
      password?: string;
      mobile?: string;
      status?: UserStatus;
    };

    if (!name || !username || !password) {
      res.status(400).json({ error: 'Name, username and password are required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      res.status(409).json({ error: 'Username already in use.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    const driver = await createUser({
      name,
      username: username.trim(),
      passwordHash,
      role: 'DRIVER',
      mobile,
      status: status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
    });

    await recordAudit({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'CREATE_DRIVER',
      entity: 'User',
      entityId: driver.id,
      details: `Created driver ${driver.username}`,
    });

    res.status(201).json({ driver: toPublicUser(driver) });
  } catch (err) {
    console.error('Create driver error:', err);
    res.status(500).json({ error: 'Server error while creating driver.' });
  }
});

// PUT /api/drivers/:id  (edit name/mobile/status, and optionally reset password)
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const target = await getUserById(id);
    if (!target || target.role !== 'DRIVER') {
      res.status(404).json({ error: 'Driver not found.' });
      return;
    }

    const { name, mobile, status, password } = req.body as {
      name?: string;
      mobile?: string;
      status?: UserStatus;
      password?: string;
    };

    const patch: Parameters<typeof updateUser>[1] = {};
    if (name !== undefined) patch.name = name;
    if (mobile !== undefined) patch.mobile = mobile;
    if (status === 'ACTIVE' || status === 'DISABLED') patch.status = status;
    if (password) {
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters.' });
        return;
      }
      patch.passwordHash = await bcrypt.hash(password, config.bcryptRounds);
    }

    const updated = await updateUser(id, patch);
    await recordAudit({
      userId: req.user!.id,
      username: req.user!.username,
      action: password ? 'RESET_DRIVER_PASSWORD' : 'UPDATE_DRIVER',
      entity: 'User',
      entityId: id,
    });

    res.json({ driver: toPublicUser(updated!) });
  } catch (err) {
    console.error('Update driver error:', err);
    res.status(500).json({ error: 'Server error while updating driver.' });
  }
});

// PATCH /api/drivers/:id/access  { grant: boolean }  -> enable/revoke access
router.patch('/:id/access', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const target = await getUserById(id);
  if (!target || target.role !== 'DRIVER') {
    res.status(404).json({ error: 'Driver not found.' });
    return;
  }
  const grant = Boolean((req.body as { grant?: boolean }).grant);
  const updated = await updateUser(id, { status: grant ? 'ACTIVE' : 'DISABLED' });
  await recordAudit({
    userId: req.user!.id,
    username: req.user!.username,
    action: grant ? 'GRANT_ACCESS' : 'REVOKE_ACCESS',
    entity: 'User',
    entityId: id,
  });
  res.json({ driver: toPublicUser(updated!) });
});

// DELETE /api/drivers/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const target = await getUserById(id);
  if (!target || target.role !== 'DRIVER') {
    res.status(404).json({ error: 'Driver not found.' });
    return;
  }
  await deleteUser(id);
  await recordAudit({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'DELETE_DRIVER',
    entity: 'User',
    entityId: id,
    details: `Deleted driver ${target.username}`,
  });
  res.json({ message: 'Driver deleted.' });
});

export default router;
