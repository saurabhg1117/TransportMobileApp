import { filter, findById, getStore, type StoreRow } from '../lib/store/index.js';
import { newId, nowIso, parseNum } from '../lib/util.js';
import type { PaymentSlip, SlipStatus } from '../models/types.js';

const TABLE = 'PaymentSlips' as const;

function toRow(slip: PaymentSlip): StoreRow {
  return {
    id: slip.id,
    slipNo: slip.slipNo,
    date: slip.date,
    driverId: slip.driverId,
    createdById: slip.createdById,
    truckNo: slip.truckNo,
    grNo: slip.grNo,
    invoiceNo: slip.invoiceNo,
    doNo: slip.doNo,
    consignor: slip.consignor,
    consignee: slip.consignee,
    fromLocation: slip.fromLocation,
    toLocation: slip.toLocation,
    driverName: slip.driverName,
    driverAddress: slip.driverAddress,
    ownerName: slip.ownerName,
    ownerAddress: slip.ownerAddress,
    bags: String(slip.bags),
    weight: String(slip.weight),
    rate: String(slip.rate),
    cash: String(slip.cash),
    diesel: String(slip.diesel),
    bank: String(slip.bank),
    commission: String(slip.commission),
    missing: String(slip.missing),
    freight: String(slip.freight),
    advance: String(slip.advance),
    balance: String(slip.balance),
    status: slip.status,
    createdAt: slip.createdAt,
    updatedAt: slip.updatedAt,
  };
}

function fromRow(row: StoreRow): PaymentSlip {
  return {
    id: row['id'] ?? '',
    slipNo: row['slipNo'] ?? '',
    date: row['date'] ?? '',
    driverId: row['driverId'] ?? '',
    createdById: row['createdById'] ?? '',
    truckNo: row['truckNo'] ?? '',
    grNo: row['grNo'] ?? '',
    invoiceNo: row['invoiceNo'] ?? '',
    doNo: row['doNo'] ?? '',
    consignor: row['consignor'] ?? '',
    consignee: row['consignee'] ?? '',
    fromLocation: row['fromLocation'] ?? '',
    toLocation: row['toLocation'] ?? '',
    driverName: row['driverName'] ?? '',
    driverAddress: row['driverAddress'] ?? '',
    ownerName: row['ownerName'] ?? '',
    ownerAddress: row['ownerAddress'] ?? '',
    bags: parseNum(row['bags']),
    weight: parseNum(row['weight']),
    rate: parseNum(row['rate']),
    cash: parseNum(row['cash']),
    diesel: parseNum(row['diesel']),
    bank: parseNum(row['bank']),
    commission: parseNum(row['commission']),
    missing: parseNum(row['missing']),
    freight: parseNum(row['freight']),
    advance: parseNum(row['advance']),
    balance: parseNum(row['balance']),
    status: (row['status'] as SlipStatus) || 'FINAL',
    createdAt: row['createdAt'] ?? '',
    updatedAt: row['updatedAt'] ?? '',
  };
}

export interface SlipMoney {
  bags: number;
  weight: number;
  rate: number;
  cash: number;
  diesel: number;
  bank: number;
  commission: number;
  missing: number;
  freight: number;
  advance: number;
  balance?: number;
}

/**
 * Balance owed after all deductions from the freight. When the caller supplies
 * an explicit balance it is respected; otherwise it is derived.
 */
export function computeBalance(m: SlipMoney): number {
  if (m.balance !== undefined && m.balance !== null && !Number.isNaN(m.balance)) {
    return m.balance;
  }
  const deductions = m.advance + m.cash + m.diesel + m.bank + m.commission + m.missing;
  return Number((m.freight - deductions).toFixed(2));
}

export interface CreateSlipInput extends SlipMoney {
  slipNo: string;
  date?: string;
  driverId: string;
  createdById: string;
  truckNo?: string;
  grNo?: string;
  invoiceNo?: string;
  doNo?: string;
  consignor?: string;
  consignee?: string;
  fromLocation?: string;
  toLocation?: string;
  driverName?: string;
  driverAddress?: string;
  ownerName?: string;
  ownerAddress?: string;
  status?: SlipStatus;
}

export async function listSlips(): Promise<PaymentSlip[]> {
  const store = await getStore();
  const rows = await store.getAll(TABLE);
  return rows.map(fromRow);
}

export async function listSlipsByDriver(driverId: string): Promise<PaymentSlip[]> {
  const store = await getStore();
  const rows = await filter(store, TABLE, (r) => r['driverId'] === driverId);
  return rows.map(fromRow);
}

export async function getSlipById(id: string): Promise<PaymentSlip | undefined> {
  const store = await getStore();
  const row = await findById(store, TABLE, id);
  return row ? fromRow(row) : undefined;
}

export async function createSlip(input: CreateSlipInput): Promise<PaymentSlip> {
  const store = await getStore();
  const now = nowIso();
  const slip: PaymentSlip = {
    id: newId(),
    slipNo: input.slipNo,
    date: input.date || now,
    driverId: input.driverId,
    createdById: input.createdById,
    truckNo: input.truckNo ?? '',
    grNo: input.grNo ?? '',
    invoiceNo: input.invoiceNo ?? '',
    doNo: input.doNo ?? '',
    consignor: input.consignor ?? '',
    consignee: input.consignee ?? '',
    fromLocation: input.fromLocation ?? '',
    toLocation: input.toLocation ?? '',
    driverName: input.driverName ?? '',
    driverAddress: input.driverAddress ?? '',
    ownerName: input.ownerName ?? '',
    ownerAddress: input.ownerAddress ?? '',
    bags: input.bags,
    weight: input.weight,
    rate: input.rate,
    cash: input.cash,
    diesel: input.diesel,
    bank: input.bank,
    commission: input.commission,
    missing: input.missing,
    freight: input.freight,
    advance: input.advance,
    balance: computeBalance(input),
    status: input.status ?? 'FINAL',
    createdAt: now,
    updatedAt: now,
  };
  await store.insert(TABLE, toRow(slip));
  return slip;
}

export type UpdateSlipInput = Partial<Omit<CreateSlipInput, 'driverId' | 'slipNo'>>;

export async function updateSlip(id: string, patch: UpdateSlipInput): Promise<PaymentSlip | undefined> {
  const store = await getStore();
  const existing = await getSlipById(id);
  if (!existing) return undefined;
  const merged: PaymentSlip = {
    ...existing,
    ...patch,
    id: existing.id,
    slipNo: existing.slipNo,
    driverId: existing.driverId,
    updatedAt: nowIso(),
  };
  merged.balance = computeBalance({ ...merged, balance: patch.balance });
  const row = await store.update(TABLE, id, toRow(merged));
  return row ? fromRow(row) : undefined;
}

export async function deleteSlip(id: string): Promise<boolean> {
  const store = await getStore();
  return store.remove(TABLE, id);
}
