import { getStore, type StoreRow } from '../lib/store/index.js';
import { newId, nowIso } from '../lib/util.js';
import type { AuditLog } from '../models/types.js';

const TABLE = 'AuditLogs' as const;

function fromRow(row: StoreRow): AuditLog {
  return {
    id: row['id'] ?? '',
    userId: row['userId'] ?? '',
    username: row['username'] ?? '',
    action: row['action'] ?? '',
    entity: row['entity'] ?? '',
    entityId: row['entityId'] ?? '',
    details: row['details'] ?? '',
    createdAt: row['createdAt'] ?? '',
  };
}

export interface RecordAuditInput {
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

/** Best-effort audit write. Never throws so it can't break the main request. */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const store = await getStore();
    const row: StoreRow = {
      id: newId(),
      userId: input.userId,
      username: input.username,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? '',
      details: input.details ?? '',
      createdAt: nowIso(),
    };
    await store.insert(TABLE, row);
  } catch (err) {
    console.error('[audit] failed to record entry:', err);
  }
}

export async function listAudit(): Promise<AuditLog[]> {
  const store = await getStore();
  const rows = await store.getAll(TABLE);
  return rows.map(fromRow);
}
