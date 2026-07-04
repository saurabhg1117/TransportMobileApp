export type UserRole = 'SUPER_ADMIN' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  mobile: string;
  createdAt: string;
  updatedAt: string;
}

/** User shape safe to return over the API (never includes the password hash). */
export type PublicUser = Omit<User, 'passwordHash'>;

export interface TransporterSettings {
  id: string;
  companyName: string;
  ownerName: string;
  mobile: string;
  alternateMobile: string;
  gst: string;
  pan: string;
  officeAddress: string;
  city: string;
  district: string;
  state: string;
  pin: string;
  logoUrl: string;
  headerText: string;
  footerText: string;
  slipPrefix: string;
  paperSize: 'A4' | 'A5' | string;
  autoNumber: boolean;
  slipCounter: number;
  terms: string;
  mandatorySlipFields: string[];
  updatedAt: string;
}

export type SlipStatus = 'DRAFT' | 'FINAL';

export interface SlipCreator {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface PaymentSlip {
  id: string;
  slipNo: string;
  date: string;
  driverId: string;
  /** App user who created this slip (set on create; older rows may be empty). */
  createdById: string;

  truckNo: string;
  grNo: string;
  invoiceNo: string;
  doNo: string;

  consignor: string;
  consignee: string;

  fromLocation: string;
  toLocation: string;

  driverName: string;
  driverAddress: string;

  ownerName: string;
  ownerAddress: string;

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
  balance: number;

  status: SlipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}
