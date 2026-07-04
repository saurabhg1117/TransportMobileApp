import type { PaymentSlip, TransporterSettings } from './types';

export function formatMoney(n: number | string): string {
  const value = typeof n === 'string' ? Number(n) || 0 : n;
  return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export interface MoneyFields {
  freight: number;
  advance: number;
  cash: number;
  diesel: number;
  bank: number;
  commission: number;
  missing: number;
}

/** Mirrors the backend rule: freight minus every deduction. */
export function computeBalance(m: MoneyFields): number {
  const deductions = m.advance + m.cash + m.diesel + m.bank + m.commission + m.missing;
  return Number((m.freight - deductions).toFixed(2));
}

/** Full address line from company settings. */
export function formatCompanyAddress(s: TransporterSettings | null | undefined): string {
  if (!s) return '';
  return [s.officeAddress, s.city, s.district, s.state, s.pin].filter(Boolean).join(', ');
}

/** GST / PAN line for slip header. */
export function formatGstPan(s: TransporterSettings | null | undefined): string {
  if (!s) return '';
  const parts: string[] = [];
  if (s.gst) parts.push(`GST: ${s.gst}`);
  if (s.pan) parts.push(`PAN: ${s.pan}`);
  return parts.join('  |  ');
}

/** Primary and alternate mobile numbers for slip header. */
export function formatCompanyPhones(s: TransporterSettings | null | undefined): string {
  if (!s) return '';
  const parts: string[] = [];
  if (s.mobile) parts.push(`Ph: ${s.mobile}`);
  if (s.alternateMobile) parts.push(`Alt: ${s.alternateMobile}`);
  return parts.join('  |  ');
}

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Builds a printable HTML representation of a payment slip for expo-print. */
export function buildSlipHtml(slip: PaymentSlip, settings: TransporterSettings | null): string {
  const s = settings;
  const isA5 = (s?.paperSize || 'A4').toUpperCase() === 'A5';
  const pageSize = isA5 ? 'A5' : 'A4';

  const money = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const date = slip.date ? new Date(slip.date).toLocaleDateString('en-IN') : '';

  const addressLine = formatCompanyAddress(s);
  const gstPan = formatGstPan(s);
  const phones = formatCompanyPhones(s);

  const infoRow = (label: string, value: unknown) =>
    `<tr><td class="k">${esc(label)}</td><td class="v">${esc(value) || '-'}</td></tr>`;

  const payRow = (label: string, value: number, strong = false) =>
    `<tr class="${strong ? 'strong' : ''}"><td>${esc(label)}</td><td class="amt">${money(value)}</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: ${pageSize}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; font-size: 12px; margin: 0; padding: 0; }
  .head-table { width: 100%; border-bottom: 3px solid #1d4ed8; margin-bottom: 12px; }
  .head-table td { vertical-align: top; padding-bottom: 10px; }
  .logo { width: 64px; height: 64px; object-fit: contain; }
  .company { font-size: 20px; font-weight: 800; color: #1e3a8a; line-height: 1.3; }
  .owner { color: #475569; font-size: 12px; font-weight: 600; margin-top: 4px; }
  .muted { color: #64748b; font-size: 11px; line-height: 1.5; margin-top: 3px; }
  .headertext { color: #64748b; font-size: 11px; margin-top: 4px; font-style: italic; }
  .titlebar { width: 100%; margin: 14px 0 8px; }
  .titlebar td { vertical-align: bottom; }
  .doc-title { font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #1d4ed8; }
  .slipno { font-size: 13px; font-weight: 700; text-align: right; }
  .data-table { width: 100%; border: 1px solid #e2e8f0; border-collapse: collapse; }
  .data-table td { padding: 5px 8px; border: 1px solid #eef2f7; }
  .data-table .k { color: #64748b; width: 38%; }
  .data-table .v { font-weight: 600; text-align: right; }
  .section-title { font-weight: 800; margin: 14px 0 6px; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 8px; border-bottom: 1px solid #eef2f7; }
  .amt { text-align: right; font-variant-numeric: tabular-nums; }
  tr.strong td { font-weight: 800; font-size: 14px; border-top: 2px solid #1d4ed8; color: #1d4ed8; }
  .terms { margin-top: 16px; font-size: 10px; color: #64748b; white-space: pre-wrap; }
  .sign { display:flex; justify-content: space-between; margin-top: 40px; }
  .sign div { border-top: 1px solid #94a3b8; padding-top: 4px; width: 40%; text-align:center; font-size: 11px; color:#475569; }
  .footer { text-align:center; color:#94a3b8; font-size: 10px; margin-top: 16px; }
</style>
</head>
<body>
  <table class="head-table" cellspacing="0" cellpadding="0">
    <tr>
      ${s?.logoUrl ? `<td style="width:72px;padding-right:12px;"><img class="logo" src="${esc(s.logoUrl)}" alt="logo" /></td>` : ''}
      <td>
        <div class="company">${esc(s?.companyName) || 'Transport Company'}</div>
        ${s?.ownerName ? `<div class="owner">${esc(s.ownerName)}</div>` : ''}
        ${addressLine ? `<div class="muted">${esc(addressLine)}</div>` : ''}
        ${phones ? `<div class="muted">${esc(phones)}</div>` : ''}
        ${gstPan ? `<div class="muted">${esc(gstPan)}</div>` : ''}
        ${s?.headerText ? `<div class="headertext">${esc(s.headerText)}</div>` : ''}
      </td>
    </tr>
  </table>

  <table class="titlebar" cellspacing="0" cellpadding="0">
    <tr>
      <td><div class="doc-title">PAYMENT SLIP</div></td>
      <td>
        <div class="slipno">No: ${esc(slip.slipNo)}</div>
        <div class="muted" style="text-align:right;">Date: ${esc(date)}</div>
      </td>
    </tr>
  </table>

  <table class="data-table">
    ${infoRow('Truck No', slip.truckNo)}
    ${infoRow('GR No', slip.grNo)}
    ${infoRow('Invoice No', slip.invoiceNo)}
    ${infoRow('DO No', slip.doNo)}
    ${infoRow('Consignor', slip.consignor)}
    ${infoRow('Consignee', slip.consignee)}
    ${infoRow('From', slip.fromLocation)}
    ${infoRow('To', slip.toLocation)}
    ${infoRow('Driver', slip.driverName)}
    ${infoRow('Owner', slip.ownerName)}
    ${infoRow('Bags', slip.bags)}
    ${infoRow('Weight', slip.weight)}
    ${infoRow('Rate', slip.rate)}
    ${infoRow('Driver Address', slip.driverAddress)}
  </table>

  <div class="section-title">Payment Details</div>
  <table>
    ${payRow('Freight', slip.freight, true)}
    ${payRow('Advance', slip.advance)}
    ${payRow('Cash', slip.cash)}
    ${payRow('Diesel', slip.diesel)}
    ${payRow('Bank', slip.bank)}
    ${payRow('Commission', slip.commission)}
    ${payRow('Missing / Shortage', slip.missing)}
    ${payRow('Balance Payable', slip.balance, true)}
  </table>

  ${s?.terms ? `<div class="terms"><b>Terms &amp; Conditions:</b>\n${esc(s.terms)}</div>` : ''}

  <div class="sign">
    <div>Driver / Owner Signature</div>
    <div>For ${esc(s?.companyName) || 'Transporter'}</div>
  </div>

  <div class="footer">${esc(s?.footerText) || 'This is a computer-generated payment slip.'}</div>
</body>
</html>`;
}
