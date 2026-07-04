import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { getUserById } from '../repositories/userRepo.js';
import type { User, UserRole } from '../models/types.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: User;
}

/**
 * Verifies the Bearer token, loads the user, and rejects disabled/revoked
 * accounts. Populates `req.user` / `req.userId` for downstream handlers.
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or malformed.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'Account no longer exists.' });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Access revoked. Please contact the administrator.' });
      return;
    }
    req.user = user;
    req.userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/** Route guard restricting access to one or more roles. Use after `authenticate`. */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action.' });
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('SUPER_ADMIN');
