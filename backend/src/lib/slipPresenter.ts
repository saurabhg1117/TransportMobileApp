import { listAudit } from '../repositories/auditRepo.js';
import { getUserById } from '../repositories/userRepo.js';
import type { PaymentSlip, SlipCreator } from '../models/types.js';
import { toPublicUser } from '../models/types.js';

export type PaymentSlipWithCreator = PaymentSlip & { createdBy?: SlipCreator };

async function buildCreateAuditMap(): Promise<Map<string, string>> {
  const audits = await listAudit();
  const map = new Map<string, string>();
  for (const entry of audits) {
    if (entry.action === 'CREATE_SLIP' && entry.entityId) {
      map.set(entry.entityId, entry.userId);
    }
  }
  return map;
}

function resolveCreatorId(slip: PaymentSlip, auditMap: Map<string, string>): string {
  return slip.createdById || auditMap.get(slip.id) || slip.driverId;
}

/** Attach creator details for Super Admin slip views (list + detail). */
export async function enrichSlipsWithCreator(
  slips: PaymentSlip[],
): Promise<PaymentSlipWithCreator[]> {
  if (slips.length === 0) return [];

  const auditMap = await buildCreateAuditMap();
  const creatorIds = [...new Set(slips.map((slip) => resolveCreatorId(slip, auditMap)))];
  const users = await Promise.all(creatorIds.map((id) => getUserById(id)));
  const userMap = new Map(
    users.filter(Boolean).map((user) => {
      const publicUser = toPublicUser(user!);
      return [
        publicUser.id,
        {
          id: publicUser.id,
          name: publicUser.name,
          username: publicUser.username,
          role: publicUser.role,
        } satisfies SlipCreator,
      ] as const;
    }),
  );

  return slips.map((slip) => {
    const creator = userMap.get(resolveCreatorId(slip, auditMap));
    return creator ? { ...slip, createdBy: creator } : slip;
  });
}

export async function enrichSlipWithCreator(slip: PaymentSlip): Promise<PaymentSlipWithCreator> {
  const [enriched] = await enrichSlipsWithCreator([slip]);
  return enriched ?? slip;
}
