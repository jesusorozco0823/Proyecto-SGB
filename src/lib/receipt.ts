import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';

type Receipt = {
  kind: 'appointment' | 'order';
  client: string;
  barber?: string;
  when: string;
  services?: { name: string; price: number }[];
  items?: { name: string; quantity: number; price: number }[];
  depositAmount?: number;
  depositStatus?: string;
  total?: number;
  paymentStatus?: string;
  status: string;
};

const depositLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  waived: 'No aplica',
};

const paymentLabel: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
};

const statusLabel: Record<string, string> = {
  scheduled: 'Programada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'Inasistencia',
  pending: 'Pendiente',
  paid: 'Pagado',
  delivered: 'Entregado',
};

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char);
}

function money(value: number) {
  return formatCop(value);
}

export function formatReceiptWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short' }).format(date);
}

export function labelDeposit(status: string) {
  return depositLabel[status] ?? status;
}

export function labelStatus(status: string) {
  return statusLabel[status] ?? status;
}

function receiptHtml(receipt: Receipt) {
  const lines = receipt.kind === 'order'
    ? (receipt.items ?? []).map((item) => `<tr><td>${escapeHtml(item.name)} x ${item.quantity}</td><td>${money(item.price)}</td></tr>`).join('')
    : (receipt.services ?? []).map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${money(item.price)}</td></tr>`).join('');
  const serviceTotal = (receipt.services ?? []).reduce((sum, item) => sum + item.price, 0);
  const summary = receipt.kind === 'order'
    ? `<p>Pago: ${escapeHtml(paymentLabel[receipt.paymentStatus ?? ''] ?? receipt.paymentStatus ?? '')}</p><p><strong>Total: ${money(receipt.total ?? 0)}</strong></p>`
    : `<p>Abono: ${money(receipt.depositAmount ?? 0)} · ${escapeHtml(labelDeposit(receipt.depositStatus ?? ''))}</p><p><strong>Total del servicio: ${money(serviceTotal)}</strong></p>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comprobante</title><style>body{font-family:sans-serif;margin:24px;color:#111}table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right}</style></head><body><h1>Comprobante</h1><p>Cliente: ${escapeHtml(receipt.client)}</p>${receipt.barber ? `<p>Barbero: ${escapeHtml(receipt.barber)}</p>` : ''}<p>${escapeHtml(formatReceiptWhen(receipt.when))}</p><p>Estado: ${escapeHtml(labelStatus(receipt.status))}</p><table>${lines}</table>${summary}</body></html>`;
}

export function printReceipt(receipt: Receipt) {
  const popup = window.open('', '_blank');
  if (!popup) {
    throw new Error('El navegador bloqueó la ventana de impresión.');
  }
  popup.document.open();
  popup.document.write(receiptHtml(receipt));
  popup.document.close();
  popup.focus();
  popup.print();
}

export async function openReceipt(path: string) {
  const popup = window.open('', '_blank');
  if (!popup) {
    throw new Error('El navegador bloqueó la ventana del comprobante.');
  }
  try {
    const receipt = await apiClient.get<Receipt>(path);
    popup.document.open();
    popup.document.write(receiptHtml(receipt));
    popup.document.close();
  } catch (error) {
    popup.close();
    throw error;
  }
}
