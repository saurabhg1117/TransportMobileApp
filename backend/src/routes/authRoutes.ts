import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { signToken } from '../lib/jwt.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { getUserByUsername, updateUser } from '../repositories/userRepo.js';
import { recordAudit } from '../repositories/auditRepo.js';
import { toPublicUser } from '../models/types.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const user = await getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Access revoked. Please contact the administrator.' });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    const token = signToken({ sub: user.id, role: user.role, username: user.username });
    await recordAudit({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
    });

    res.json({
      token,
      sessionTimeoutMinutes: config.sessionTimeoutMinutes,
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: toPublicUser(req.user!) });
});

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
      };
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current and new passwords are required.' });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters.' });
        return;
      }

      const user = req.user!;
      const ok = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!ok) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
      await updateUser(user.id, { passwordHash });
      await recordAudit({
        userId: user.id,
        username: user.username,
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: user.id,
      });

      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Server error while changing password.' });
    }
  },
);

// POST /api/auth/forgot-password
// Password reset is administered by the Super Admin (FR-002 "Reset Passwords").
// This endpoint acknowledges the request without leaking whether the user exists.
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  const { username } = req.body as { username?: string };
  if (username) {
    const user = await getUserByUsername(username);
    if (user) {
      await recordAudit({
        userId: user.id,
        username: user.username,
        action: 'FORGOT_PASSWORD_REQUEST',
        entity: 'User',
        entityId: user.id,
      });
    }
  }
  res.json({
    message:
      'If the account exists, your administrator has been notified to reset the password.',
  });
});

export default router;
