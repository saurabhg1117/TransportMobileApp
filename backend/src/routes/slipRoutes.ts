import { Router, type Response } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  createSlip,
  deleteSlip,
  getSlipById,
  listSlips,
  listSlipsByDriver,
  updateSlip,
  type CreateSlipInput,
  type UpdateSlipInput,
} from '../repositories/slipRepo.js';
import { getSettings, nextSlipNumber } from '../repositories/settingsRepo.js';
import { getUserById } from '../repositories/userRepo.js';
import { recordAudit } from '../repositories/auditRepo.js';
import { parseNum } from '../lib/util.js';
import { validateMandatorySlipFields } from '../lib/slipFields.js';
import { enrichSlipWithCreator, enrichSlipsWithCreator } from '../lib/slipPresenter.js';
import type { PaymentSlip } from '../models/types.js';

const router = Router();
router.use(authenticate);

const MONEY_FIELDS = [
  'bags',
  'weight',
  'rate',
  'cash',
  'diesel',
  'bank',
  'commission',
  'missing',
  'freight',
  'advance',
] as const;

const TEXT_FIELDS = [
  'truckNo',
  'grNo',
  'invoiceNo',
  'doNo',
  'consignor',
  'consignee',
  'fromLocation',
  'toLocation',
  'driverName',
  'driverAddress',
  'ownerName',
  'ownerAddress',
] as const;

function isAdmin(req: AuthRequest): boolean {
  return req.user?.role === 'SUPER_ADMIN';
}

/** A driver may only touch their own slips; the Super Admin may touch any. */
function canAccess(req: AuthRequest, slip: PaymentSlip): boolean {
  return isAdmin(req) || slip.driverId === req.userId;
}

// GET /api/payment-slips
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const slips = isAdmin(req) ? await listSlips() : await listSlipsByDriver(req.userId!);
  if (isAdmin(req)) {
    res.json({ slips: await enrichSlipsWithCreator(slips) });
    return;
  }
  res.json({ slips });
});

// GET /api/payment-slips/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const slip = await getSlipById(req.params['id'] as string);
  if (!slip) {
    res.status(404).json({ error: 'Slip not found.' });
    return;
  }
  if (!canAccess(req, slip)) {
    res.status(403).json({ error: 'You cannot access this slip.' });
    return;
  }
  if (isAdmin(req)) {
    res.json({ slip: await enrichSlipWithCreator(slip) });
    return;
  }
  res.json({ slip });
});

function slipBodyForValidation(body: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) {
    data[field] = body[field] !== undefined ? String(body[field]) : '';
  }
  for (const field of MONEY_FIELDS) {
    const raw = body[field];
    data[field] =
      raw !== undefined && raw !== null && String(raw).trim() !== '' ? raw : '';
  }
  return data;
}

function mergedSlipForValidation(
  existing: PaymentSlip,
  body: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = { ...existing };
  for (const field of TEXT_FIELDS) {
    if (body[field] !== undefined) data[field] = String(body[field]);
  }
  for (const field of MONEY_FIELDS) {
    if (body[field] !== undefined) {
      const raw = body[field];
      data[field] =
        raw !== undefined && raw !== null && String(raw).trim() !== '' ? parseNum(raw as string) : '';
    }
  }
  return data;
}

// POST /api/payment-slips
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;

    // A driver always books slips under their own account. An admin may specify
    // a driverId to book on behalf of a driver, defaulting to themselves.
    let driverId = req.userId!;
    if (isAdmin(req) && typeof body['driverId'] === 'string' && body['driverId']) {
      const driver = await getUserById(body['driverId']);
      if (!driver) {
        res.status(400).json({ error: 'Specified driver does not exist.' });
        return;
      }
      driverId = driver.id;
    }

    const settings = await getSettings();
    let slipNo = typeof body['slipNo'] === 'string' ? (body['slipNo'] as string).trim() : '';
    if (!slipNo) {
      if (!settings.autoNumber) {
        res.status(400).json({ error: 'Slip number is required (auto-numbering is disabled).' });
        return;
      }
      slipNo = await nextSlipNumber();
    }

    const raw: Record<string, unknown> = {
      slipNo,
      driverId,
      date: typeof body['date'] === 'string' ? (body['date'] as string) : undefined,
      status: body['status'] === 'DRAFT' ? 'DRAFT' : 'FINAL',
    };

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) raw[field] = String(body[field]);
    }
    for (const field of MONEY_FIELDS) {
      raw[field] = parseNum(body[field] as string);
    }
    if (body['balance'] !== undefined) raw['balance'] = parseNum(body['balance'] as string);

    const validationError = validateMandatorySlipFields(
      settings.mandatorySlipFields,
      slipBodyForValidation(body),
    );
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const slip = await createSlip({
      ...(raw as unknown as CreateSlipInput),
      createdById: req.userId!,
    });
    await recordAudit({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'CREATE_SLIP',
      entity: 'PaymentSlip',
      entityId: slip.id,
      details: `Slip ${slip.slipNo}`,
    });

    res.status(201).json({ slip: isAdmin(req) ? await enrichSlipWithCreator(slip) : slip });
  } catch (err) {
    console.error('Create slip error:', err);
    res.status(500).json({ error: 'Server error while creating slip.' });
  }
});

// PUT /api/payment-slips/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params['id'] as string;
    const existing = await getSlipById(id);
    if (!existing) {
      res.status(404).json({ error: 'Slip not found.' });
      return;
    }
    if (!canAccess(req, existing)) {
      res.status(403).json({ error: 'You cannot modify this slip.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const patch: UpdateSlipInput = {};
    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) (patch as Record<string, unknown>)[field] = String(body[field]);
    }
    for (const field of MONEY_FIELDS) {
      if (body[field] !== undefined) (patch as Record<string, unknown>)[field] = parseNum(body[field] as string);
    }
    if (body['balance'] !== undefined) patch.balance = parseNum(body['balance'] as string);
    if (body['date'] !== undefined) patch.date = String(body['date']);
    if (body['status'] === 'DRAFT' || body['status'] === 'FINAL') patch.status = body['status'];

    const settings = await getSettings();
    const validationError = validateMandatorySlipFields(
      settings.mandatorySlipFields,
      mergedSlipForValidation(existing, body),
    );
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const updated = await updateSlip(id, patch);
    await recordAudit({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'UPDATE_SLIP',
      entity: 'PaymentSlip',
      entityId: id,
    });
    res.json({ slip: updated });
  } catch (err) {
    console.error('Update slip error:', err);
    res.status(500).json({ error: 'Server error while updating slip.' });
  }
});

// DELETE /api/payment-slips/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = req.params['id'] as string;
  const existing = await getSlipById(id);
  if (!existing) {
    res.status(404).json({ error: 'Slip not found.' });
    return;
  }
  if (!canAccess(req, existing)) {
    res.status(403).json({ error: 'You cannot delete this slip.' });
    return;
  }
  await deleteSlip(id);
  await recordAudit({
    userId: req.user!.id,
    username: req.user!.username,
    action: 'DELETE_SLIP',
    entity: 'PaymentSlip',
    entityId: id,
    details: `Slip ${existing.slipNo}`,
  });
  res.json({ message: 'Slip deleted.' });
});

export default router;
