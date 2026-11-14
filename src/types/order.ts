import type { StoryLanguageCode } from './story';

export interface OrderCustomer {
  fullName: string;
  phone: string;
  governorate: string;
  delegation: string;
  address: string;
  notes: string;
}

export interface OrderItem {
  storyId: string;
  storyTitle: string;
  storyDomain?: string;
  storyIdea?: string;
  childName: string;
  childAge: number;
  language: StoryLanguageCode;
  dedication: string;
  childPhotoBase64: string;
  unitPrice: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'printing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderDocument {
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'COD';
  status: OrderStatus;
  confirmedAccurate: boolean;
  userId: string | null;
  createdAt: unknown;
}

export interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'COD';
}
