import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '../types/cart';
import {
  addItemToCartList,
  createCustomizationId,
  removeItemFromCartList,
  replaceCartItemInList,
  updateItemQuantityInList,
} from '../utils/cartLogic';
import { calculateDeliveryFee, calculateSubtotal, calculateTotal } from '../utils/pricing';

const CART_STORAGE_KEY = 'mls_cart_v1';

interface CartContextValue {
  items: CartItem[];
  totalCount: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  addToCart: (item: Omit<CartItem, 'customizationId' | 'quantity'>, quantity?: number) => CartItem;
  updateCartItem: (customizationId: string, updated: CartItem) => void;
  updateQuantity: (customizationId: string, quantity: number) => void;
  removeItem: (customizationId: string) => void;
  clearCart: () => void;
  getItemByCustomizationId: (customizationId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item.customizationId === 'string' &&
        typeof item.storyId === 'string' &&
        typeof item.childName === 'string' &&
        typeof item.unitPrice === 'number' &&
        typeof item.quantity === 'number'
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota issues safely
    }
  }, [items]);

  const addToCart = (
    draft: Omit<CartItem, 'customizationId' | 'quantity'>,
    quantity: number = 1
  ): CartItem => {
    const newItem: CartItem = {
      ...draft,
      customizationId: createCustomizationId(),
      quantity,
    };
    setItems((prev) => addItemToCartList(prev, newItem));
    return newItem;
  };

  const updateCartItem = (customizationId: string, updated: CartItem) => {
    setItems((prev) => replaceCartItemInList(prev, customizationId, updated));
  };

  const updateQuantity = (customizationId: string, quantity: number) => {
    setItems((prev) => updateItemQuantityInList(prev, customizationId, quantity));
  };

  const removeItem = (customizationId: string) => {
    setItems((prev) => removeItemFromCartList(prev, customizationId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemByCustomizationId = (customizationId: string) =>
    items.find((item) => item.customizationId === customizationId);

  const value = useMemo<CartContextValue>(() => {
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = calculateSubtotal(items);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = calculateTotal(subtotal, deliveryFee);
    return {
      items,
      totalCount,
      subtotal,
      deliveryFee,
      total,
      addToCart,
      updateCartItem,
      updateQuantity,
      removeItem,
      clearCart,
      getItemByCustomizationId,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
