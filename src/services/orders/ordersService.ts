import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase/firebase';
import { DEFAULT_CUSTOM_BOOK_PRICE } from '../../utils/adminSecurity';
import type { CartItem } from '../../types/cart';
import type {
  OrderConfirmation,
  OrderCustomer,
  OrderDocument,
  OrderItem,
  OrderStatus,
} from '../../types/order';
import {
  calculateDeliveryFee,
  calculateSubtotal,
  calculateTotal,
  generateOrderNumber,
} from '../../utils/pricing';
import { ImageService } from '../images/ImageService';

const ORDERS_COLLECTION = 'orders';
export const CUSTOM_FREEFORM_STORY_ID = 'custom-freeform';

function createOrderDocId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ord_${crypto.randomUUID().replace(/-/g, '')}`;
  }
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createOrder(params: {
  customer: OrderCustomer;
  cartItems: CartItem[];
  confirmedAccurate: boolean;
}): Promise<OrderConfirmation> {
  if (!params.confirmedAccurate) {
    throw new Error('CONFIRMATION_REQUIRED');
  }
  if (!params.cartItems.length) {
    throw new Error('EMPTY_CART');
  }
  if (params.cartItems.length > 10) {
    throw new Error('MAX_ORDER_ITEMS_EXCEEDED');
  }

  // SECURITY: Never trust unitPrice or storyTitle sent from client cart state.
  // Re-fetch each referenced story (or /settings/storefront for custom-freeform) from Firestore.
  const uniqueStoryIds = Array.from(new Set(params.cartItems.map((i) => i.storyId)));
  const authoritativeStories = new Map<
    string,
    { price: number; title: string; active: boolean }
  >();

  for (const storyId of uniqueStoryIds) {
    if (storyId === CUSTOM_FREEFORM_STORY_ID) {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'storefront'));
        const settingsPrice = settingsSnap.exists()
          ? Number((settingsSnap.data() as Record<string, unknown>).customBookPrice)
          : NaN;
        const authoritativePrice =
          Number.isFinite(settingsPrice) && settingsPrice > 0
            ? settingsPrice
            : DEFAULT_CUSTOM_BOOK_PRICE;
        const matchingItem = params.cartItems.find((i) => i.storyId === CUSTOM_FREEFORM_STORY_ID);
        authoritativeStories.set(storyId, {
          price: authoritativePrice,
          title: matchingItem?.storyDomain || matchingItem?.storyTitle || 'Custom Storybook',
          active: true,
        });
        continue;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/storefront');
      }
    }

    try {
      const snap = await getDoc(doc(db, 'stories', storyId));
      if (!snap.exists()) {
        throw new Error(`STORY_NOT_FOUND:${storyId}`);
      }
      const data = snap.data() as Record<string, unknown>;
      const active = Boolean(data.active);
      const price = Number(data.price);
      const title = String(data.title ?? '');
      if (!active || !Number.isFinite(price) || price <= 0) {
        throw new Error(`STORY_UNAVAILABLE:${storyId}`);
      }
      authoritativeStories.set(storyId, { price, title, active });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.startsWith('STORY_NOT_FOUND:') ||
          error.message.startsWith('STORY_UNAVAILABLE:'))
      ) {
        throw error;
      }
      handleFirestoreError(error, OperationType.GET, `stories/${storyId}`);
    }
  }

  const verifiedItems: OrderItem[] = params.cartItems.map((item) => {
    const authStory = authoritativeStories.get(item.storyId)!;
    const cleanDomain = item.storyDomain?.trim().slice(0, 120);
    const cleanIdea = item.storyIdea?.trim().slice(0, 1200);
    return {
      storyId: item.storyId,
      storyTitle: authStory.title,
      ...(cleanDomain ? { storyDomain: cleanDomain } : {}),
      ...(cleanIdea ? { storyIdea: cleanIdea } : {}),
      childName: item.childName.trim(),
      childAge: Math.floor(item.childAge),
      language: item.language,
      dedication: item.dedication.trim(),
      childPhotoBase64: item.childPhotoBase64,
      unitPrice: authStory.price,
      quantity: Math.max(1, Math.min(20, Math.floor(item.quantity))),
    };
  });

  const subtotal = calculateSubtotal(verifiedItems);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = calculateTotal(subtotal, deliveryFee);
  const orderNumber = generateOrderNumber();
  const orderId = createOrderDocId();

  const orderPayload = {
    orderNumber,
    customer: {
      fullName: params.customer.fullName.trim(),
      phone: params.customer.phone.trim(),
      governorate: params.customer.governorate.trim(),
      delegation: params.customer.delegation.trim(),
      address: params.customer.address.trim(),
      notes: params.customer.notes.trim(),
    },
    items: verifiedItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: 'COD' as const,
    status: 'pending' as const,
    confirmedAccurate: true,
    userId: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  };

  // Validate total Firestore document byte footprint before writing
  const sizeCheck = ImageService.validateFirestoreDocumentSize({
    ...orderPayload,
    createdAt: new Date().toISOString(),
  });
  if (!sizeCheck.valid) {
    throw new Error('ORDER_DOCUMENT_TOO_LARGE');
  }

  try {
    await setDoc(doc(db, ORDERS_COLLECTION, orderId), orderPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${ORDERS_COLLECTION}/${orderId}`);
  }

  return {
    orderId,
    orderNumber,
    customer: orderPayload.customer,
    items: verifiedItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod: 'COD',
  };
}

export interface AdminOrderRecord extends OrderDocument {
  id: string;
}

export async function fetchOrdersForAdmin(): Promise<AdminOrderRecord[]> {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as OrderDocument),
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ORDERS_COLLECTION);
  }
}

export async function updateOrderStatusByAdmin(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}
