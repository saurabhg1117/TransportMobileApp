import { Router, type Response } from 'express';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { getSettings, updateSettings, type UpdateSettingsInput } from '../repositories/settingsRepo.js';
import { recordAudit } from '../repositories/auditRepo.js';

const router = Router();

// GET /api/settings  -> any authenticated user can read branding/company info
// (drivers need it to render slips).
router.get('/', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  const settings = await getSettings();
  res.json({ settings });
});

// Fields the Super Admin may configure (FR-003).
const EDITABLE_FIELDS: (keyof UpdateSettingsInput)[] = [
  'companyName',
  'ownerName',
  'mobile',
  'alternateMobile',
  'gst',
  'pan',
  'officeAddress',
  'city',
  'district',
  'state',
  'pin',
  'logoUrl',
  'headerText',
  'footerText',
  'slipPrefix',
  'paperSize',
  'autoNumber',
  'terms',
  'mandatorySlipFields',
];

// PUT /api/settings  -> Super Admin only
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const patch: UpdateSettingsInput = {};
    for (const field of EDITABLE_FIELDS) {
      if (body[field] === undefined) continue;
      if (field === 'autoNumber') {
        patch.autoNumber = Boolean(body[field]);
      } else if (field === 'mandatorySlipFields') {
        const raw = body[field];
        patch.mandatorySlipFields = Array.isArray(raw)
          ? raw.filter((k): k is string => typeof k === 'string')
          : [];
      } else {
        (patch as Record<string, unknown>)[field] = String(body[field]);
      }
    }

    const settings = await updateSettings(patch);
    await recordAudit({
      userId: req.user!.id,
      username: req.user!.username,
      action: 'UPDATE_SETTINGS',
      entity: 'TransporterSettings',
      entityId: settings.id,
    });
    res.json({ settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Server error while updating settings.' });
  }
});

export default router;
