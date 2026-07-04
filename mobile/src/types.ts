export type UserRole = 'SUPER_ADMIN' | 'DRIVER';
export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  mobile: string;
  createdAt: string;
  updatedAt: string;
}

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
  paperSize: string;
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
  createdById?: string;

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
  /** Present on admin API responses — who created this slip in the app. */
  createdBy?: SlipCreator;
}
