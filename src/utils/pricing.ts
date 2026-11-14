import type { UILanguage } from '../types/i18n';

export const DELIVERY_FEE_TND = 7;
export const FREE_DELIVERY_THRESHOLD_TND = 130;

export interface PricedLineItem {
  unitPrice: number;
  quantity: number;
}

export function roundTND(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateSubtotal(items: PricedLineItem[]): number {
  const sum = items.reduce((acc, item) => {
    const qty = Math.max(0, Math.floor(item.quantity));
    const price = Math.max(0, item.unitPrice);
    return acc + price * qty;
  }, 0);
  return roundTND(sum);
}

export function calculateDeliveryFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD_TND ? 0 : DELIVERY_FEE_TND;
}

export function calculateTotal(subtotal: number, deliveryFee: number): number {
  return roundTND(Math.max(0, subtotal) + Math.max(0, deliveryFee));
}

export function formatTND(amount: number, lang: UILanguage = 'ar'): string {
  const formatted = amount % 1 === 0 ? String(amount) : amount.toFixed(2);
  if (lang === 'ar') return `${formatted} د.ت`;
  return `${formatted} TND`;
}

export function generateOrderNumber(now: Date = new Date(), randomSuffix?: string): string {
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = randomSuffix;
  if (!suffix || !/^[A-Z0-9]{4}$/.test(suffix)) {
    suffix = '';
    for (let i = 0; i < 4; i += 1) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return `MLS-${yy}${mm}${dd}-${suffix}`;
}
