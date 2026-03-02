import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function getStatusLabel(status) {
  const labels = {
    pending_contract: 'Pendiente Contrato',
    pending_payment: 'Pendiente Pago',
    pending_identity: 'Pendiente Identidad',
    effective: 'Incorporación Efectiva',
    pending: 'Pendiente',
    paid: 'Pagado',
    signed: 'Firmado',
    draft: 'Borrador',
    published: 'Publicado',
    valid: 'Válido',
    invalid: 'Inválido',
  };
  return labels[status] || status;
}

export function getStatusClass(status) {
  if (status === 'effective' || status === 'paid' || status === 'valid' || status === 'published') {
    return 'status-effective';
  }
  if (status === 'signed') {
    return 'status-signed';
  }
  if (status === 'invalid') {
    return 'status-invalid';
  }
  if (status === 'draft') {
    return 'status-draft';
  }
  return 'status-pending';
}
