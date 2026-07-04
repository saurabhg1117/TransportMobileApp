import { getStore, type StoreRow } from '../lib/store/index.js';
import { parseMandatorySlipFields, stringifyMandatorySlipFields } from '../lib/slipFields.js';
import { newId, nowIso, parseBool, parseNum } from '../lib/util.js';
import type { TransporterSettings } from '../models/types.js';

const TABLE = 'TransporterSettings' as const;
const SETTINGS_ID = 'transporter';

function toRow(s: TransporterSettings): StoreRow {
  return {
    id: s.id,
    companyName: s.companyName,
    ownerName: s.ownerName,
    mobile: s.mobile,
    alternateMobile: s.alternateMobile,
    gst: s.gst,
    pan: s.pan,
    officeAddress: s.officeAddress,
    city: s.city,
    district: s.district,
    state: s.state,
    pin: s.pin,
    logoUrl: s.logoUrl,
    headerText: s.headerText,
    footerText: s.footerText,
    slipPrefix: s.slipPrefix,
    paperSize: s.paperSize,
    autoNumber: String(s.autoNumber),
    slipCounter: String(s.slipCounter),
    terms: s.terms,
    mandatorySlipFields: stringifyMandatorySlipFields(s.mandatorySlipFields),
    updatedAt: s.updatedAt,
  };
}

function fromRow(row: StoreRow): TransporterSettings {
  return {
    id: row['id'] || SETTINGS_ID,
    companyName: row['companyName'] ?? '',
    ownerName: row['ownerName'] ?? '',
    mobile: row['mobile'] ?? '',
    alternateMobile: row['alternateMobile'] ?? '',
    gst: row['gst'] ?? '',
    pan: row['pan'] ?? '',
    officeAddress: row['officeAddress'] ?? '',
    city: row['city'] ?? '',
    district: row['district'] ?? '',
    state: row['state'] ?? '',
    pin: row['pin'] ?? '',
    logoUrl: row['logoUrl'] ?? '',
    headerText: row['headerText'] ?? '',
    footerText: row['footerText'] ?? '',
    slipPrefix: row['slipPrefix'] || 'TPS-',
    paperSize: row['paperSize'] || 'A4',
    autoNumber: parseBool(row['autoNumber']),
    slipCounter: parseNum(row['slipCounter']),
    terms: row['terms'] ?? '',
    mandatorySlipFields: parseMandatorySlipFields(row['mandatorySlipFields']),
    updatedAt: row['updatedAt'] ?? '',
  };
}

function defaults(): TransporterSettings {
  return {
    id: SETTINGS_ID,
    companyName: '',
    ownerName: '',
    mobile: '',
    alternateMobile: '',
    gst: '',
    pan: '',
    officeAddress: '',
    city: '',
    district: '',
    state: '',
    pin: '',
    logoUrl: '',
    headerText: '',
    footerText: '',
    slipPrefix: 'TPS-',
    paperSize: 'A4',
    autoNumber: true,
    slipCounter: 0,
    terms: '',
    mandatorySlipFields: [],
    updatedAt: nowIso(),
  };
}

/** Returns the single settings record, creating a default one if none exists. */
export async function getSettings(): Promise<TransporterSettings> {
  const store = await getStore();
  const rows = await store.getAll(TABLE);
  const existing = rows[0];
  if (existing) return fromRow(existing);
  const created = defaults();
  await store.insert(TABLE, toRow(created));
  return created;
}

export type UpdateSettingsInput = Partial<Omit<TransporterSettings, 'id' | 'updatedAt' | 'slipCounter'>>;

export async function updateSettings(patch: UpdateSettingsInput): Promise<TransporterSettings> {
  const store = await getStore();
  const current = await getSettings();
  const updated: TransporterSettings = { ...current, ...patch, id: current.id, updatedAt: nowIso() };
  await store.update(TABLE, current.id, toRow(updated));
  return updated;
}

/**
 * Atomically-ish reserve the next slip number and persist the incremented
 * counter. Returns the formatted slip number, e.g. "TPS-000123".
 */
export async function nextSlipNumber(): Promise<string> {
  const store = await getStore();
  const current = await getSettings();
  const next = current.slipCounter + 1;
  const updated: TransporterSettings = { ...current, slipCounter: next, updatedAt: nowIso() };
  await store.update(TABLE, current.id, toRow(updated));
  const padded = String(next).padStart(6, '0');
  return `${current.slipPrefix}${padded}`;
}

export const settingsId = SETTINGS_ID;
