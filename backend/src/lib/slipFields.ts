/** Configurable slip input fields (excludes slipNo, balance, date, status). */
export const SLIP_FIELD_KEYS = [
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
  'bags',
  'weight',
  'rate',
  'freight',
  'advance',
  'cash',
  'diesel',
  'bank',
  'commission',
  'missing',
] as const;

export type SlipFieldKey = (typeof SLIP_FIELD_KEYS)[number];

export const SLIP_FIELD_LABELS: Record<SlipFieldKey, string> = {
  truckNo: 'Truck number',
  grNo: 'GR number',
  invoiceNo: 'Invoice number',
  doNo: 'DO number',
  consignor: 'Consignor',
  consignee: 'Consignee',
  fromLocation: 'From',
  toLocation: 'To',
  driverName: 'Driver name',
  driverAddress: 'Driver address',
  ownerName: 'Owner name',
  ownerAddress: 'Owner address',
  bags: 'Bags',
  weight: 'Weight',
  rate: 'Rate',
  freight: 'Freight',
  advance: 'Advance',
  cash: 'Cash',
  diesel: 'Diesel',
  bank: 'Bank',
  commission: 'Commission',
  missing: 'Missing / Shortage',
};

export const SLIP_FIELD_GROUPS: { title: string; keys: SlipFieldKey[] }[] = [
  {
    title: 'Vehicle & Documents',
    keys: ['truckNo', 'grNo', 'invoiceNo', 'doNo'],
  },
  {
    title: 'Parties',
    keys: ['consignor', 'consignee'],
  },
  {
    title: 'Route',
    keys: ['fromLocation', 'toLocation'],
  },
  {
    title: 'Driver',
    keys: ['driverName', 'driverAddress'],
  },
  {
    title: 'Owner',
    keys: ['ownerName', 'ownerAddress'],
  },
  {
    title: 'Cargo',
    keys: ['bags', 'weight', 'rate'],
  },
  {
    title: 'Payment',
    keys: ['freight', 'advance', 'cash', 'diesel', 'bank', 'commission', 'missing'],
  },
];

const NUMERIC_FIELDS = new Set<SlipFieldKey>([
  'bags',
  'weight',
  'rate',
  'freight',
  'advance',
  'cash',
  'diesel',
  'bank',
  'commission',
  'missing',
]);

export function isSlipFieldKey(value: string): value is SlipFieldKey {
  return (SLIP_FIELD_KEYS as readonly string[]).includes(value);
}

export function parseMandatorySlipFields(raw: string | undefined | null): SlipFieldKey[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((k): k is SlipFieldKey => typeof k === 'string' && isSlipFieldKey(k));
  } catch {
    return [];
  }
}

export function stringifyMandatorySlipFields(fields: readonly string[]): string {
  const valid = fields.filter(isSlipFieldKey);
  return JSON.stringify(valid);
}

export function isSlipFieldFilled(key: SlipFieldKey, value: unknown): boolean {
  if (NUMERIC_FIELDS.has(key)) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return typeof value === 'number' && !Number.isNaN(value);
  }
  return String(value ?? '').trim() !== '';
}

/** Returns an error message when required fields are missing, else null. */
export function validateMandatorySlipFields(
  mandatory: readonly string[],
  data: Record<string, unknown>,
): string | null {
  const missing: string[] = [];
  for (const key of mandatory) {
    if (!isSlipFieldKey(key)) continue;
    if (!isSlipFieldFilled(key, data[key])) {
      missing.push(SLIP_FIELD_LABELS[key]);
    }
  }
  if (missing.length === 0) return null;
  return `Required field(s) missing: ${missing.join(', ')}`;
}
