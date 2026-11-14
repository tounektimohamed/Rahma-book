import type { CartItem } from '../types/cart';

export function buildCustomizationSignature(
  item: Pick<
    CartItem,
    | 'storyId'
    | 'storyDomain'
    | 'storyIdea'
    | 'childName'
    | 'childAge'
    | 'language'
    | 'dedication'
    | 'childPhotoBase64'
  >
): string {
  const normalizedName = item.childName.trim().toLowerCase();
  const normalizedDedication = item.dedication.trim();
  const normalizedDomain = (item.storyDomain ?? '').trim().toLowerCase();
  const normalizedIdea = (item.storyIdea ?? '').trim().toLowerCase();
  // Include a deterministic fingerprint of the photo so different photos for the same child stay distinct
  const photoFingerprint = `${item.childPhotoBase64.length}:${item.childPhotoBase64.slice(-24)}`;
  return `${item.storyId}|${normalizedDomain}|${normalizedIdea}|${normalizedName}|${item.childAge}|${item.language}|${normalizedDedication}|${photoFingerprint}`;
}

export function createCustomizationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cust_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addItemToCartList(items: CartItem[], newItem: CartItem): CartItem[] {
  const incomingSig = buildCustomizationSignature(newItem);
  const existingIdx = items.findIndex(
    (item) => buildCustomizationSignature(item) === incomingSig
  );

  if (existingIdx >= 0) {
    return items.map((item, idx) =>
      idx === existingIdx
        ? { ...item, quantity: Math.min(20, item.quantity + Math.max(1, newItem.quantity)) }
        : item
    );
  }

  return [...items, { ...newItem, quantity: Math.max(1, Math.min(20, newItem.quantity)) }];
}

export function updateItemQuantityInList(
  items: CartItem[],
  customizationId: string,
  nextQuantity: number
): CartItem[] {
  const clamped = Math.floor(nextQuantity);
  if (clamped <= 0) {
    return items.filter((item) => item.customizationId !== customizationId);
  }
  return items.map((item) =>
    item.customizationId === customizationId
      ? { ...item, quantity: Math.min(20, clamped) }
      : item
  );
}

export function replaceCartItemInList(
  items: CartItem[],
  customizationId: string,
  updatedItem: CartItem
): CartItem[] {
  return items.map((item) =>
    item.customizationId === customizationId ? updatedItem : item
  );
}

export function removeItemFromCartList(
  items: CartItem[],
  customizationId: string
): CartItem[] {
  return items.filter((item) => item.customizationId !== customizationId);
}
