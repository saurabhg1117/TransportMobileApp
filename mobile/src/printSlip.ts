import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { buildSlipHtml } from './slip';
import type { PaymentSlip, TransporterSettings } from './types';

function pdfFormat(settings: TransporterSettings | null): 'a4' | 'a5' {
  return (settings?.paperSize || 'A4').toUpperCase() === 'A5' ? 'a5' : 'a4';
}

function safeFilename(slipNo: string): string {
  return `slip-${slipNo.replace(/[^\w.-]+/g, '_')}.pdf`;
}

/** Render slip HTML in an off-screen iframe and return the iframe + body element. */
function renderHtmlInIframe(html: string): { iframe: HTMLIFrameElement; body: HTMLElement } {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Payment slip');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error('Could not prepare slip document.');
  }

  doc.open();
  doc.write(html);
  doc.close();

  return { iframe, body: doc.body };
}

function waitForIframe(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    iframe.onload = () => resolve();
    setTimeout(resolve, 400);
  });
}

/**
 * On web, expo-print ignores HTML and prints the current page.
 * This renders the slip in an iframe and opens the browser print dialog.
 */
function printHtmlInBrowser(html: string): void {
  const { iframe, body: _body } = renderHtmlInIframe(html);
  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    throw new Error('Could not open print preview.');
  }

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  void waitForIframe(iframe).then(() => {
    win.focus();
    win.addEventListener('afterprint', cleanup, { once: true });
    win.print();
    setTimeout(cleanup, 60_000);
  });
}

/** Generate and download a PDF file in the browser. */
async function downloadPdfInBrowser(
  html: string,
  filename: string,
  format: 'a4' | 'a5',
): Promise<void> {
  const { iframe, body } = renderHtmlInIframe(html);
  try {
    await waitForIframe(iframe);
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format, orientation: 'portrait' },
      })
      .from(body)
      .save();
  } finally {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }
}

export async function printSlip(
  slip: PaymentSlip,
  settings: TransporterSettings | null,
): Promise<void> {
  const html = buildSlipHtml(slip, settings);
  if (Platform.OS === 'web') {
    printHtmlInBrowser(html);
    return;
  }
  await Print.printAsync({ html });
}

export type ExportPdfResult = { uri: string } | { web: true; filename: string };

export async function exportSlipPdf(
  slip: PaymentSlip,
  settings: TransporterSettings | null,
): Promise<ExportPdfResult> {
  const html = buildSlipHtml(slip, settings);
  const filename = safeFilename(slip.slipNo);

  if (Platform.OS === 'web') {
    await downloadPdfInBrowser(html, filename, pdfFormat(settings));
    return { web: true, filename };
  }

  return Print.printToFileAsync({ html });
}
