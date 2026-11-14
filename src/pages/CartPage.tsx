import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, UserCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orders/ordersService';
import type { CartItem } from '../types/cart';
import type { OrderConfirmation } from '../types/order';
import type { CheckoutFormValues } from '../utils/validation';
import { formatTND } from '../utils/pricing';
import { CartItemRow } from '../components/cart/CartItemRow';
import { CheckoutForm } from '../components/checkout/CheckoutForm';
import { OrderConfirmationCard } from '../components/checkout/OrderConfirmationCard';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function CartPage() {
  const { lang, t } = useLanguage();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { user, signInWithGoogle, logout } = useAuth();
  const navigate = useNavigate();

  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  const handleEditItem = (item: CartItem) => {
    navigate(`/customize/${item.storyId}?edit=${item.customizationId}`);
  };

  const handlePlaceOrder = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const orderConfirmation = await createOrder({
        customer: {
          fullName: values.fullName,
          phone: values.phone,
          governorate: values.governorate,
          delegation: values.delegation,
          address: values.address,
          notes: values.notes || '',
        },
        cartItems: items,
        confirmedAccurate: values.confirmedAccurate,
      });

      // Clear cart ONLY after Firestore confirms order creation
      clearCart();
      setConfirmation(orderConfirmation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitError(t.orderErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <OrderConfirmationCard confirmation={confirmation} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F8E8DC] flex items-center justify-center">
          <ShoppingBag className="w-7 h-7 text-[#443B3B]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-[#443B3B]">{t.cartEmptyTitle}</h1>
        <p className="text-sm sm:text-base text-[#706464]">{t.cartEmptyDesc}</p>
        <Link
          to="/stories"
          className="inline-block px-6 py-3.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] transition-colors"
        >
          {t.cartBrowseBtn}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">{t.cartTitle}</h1>

        {/* Optional Google Auth linking */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 text-xs bg-white border border-[#EADFD7] rounded-xl px-3.5 py-2">
              <UserCheck className="w-4 h-4 text-[#4E7A56]" aria-hidden="true" />
              <span className="text-[#706464]">
                {t.accountSignedInAs} <strong className="text-[#443B3B]">{user.displayName || user.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="text-[#8E2F2F] font-semibold underline cursor-pointer"
              >
                {t.accountSignOutBtn}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="px-3.5 py-2 rounded-xl border border-[#EADFD7] bg-white text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
            >
              {t.accountSignInBtn}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items + Price Summary */}
        <div className="lg:col-span-6 space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={item.customizationId}
              item={item}
              onUpdateQuantity={updateQuantity}
              onEdit={handleEditItem}
              onRequestRemove={setItemToRemove}
            />
          ))}

          {/* Order Pricing Breakdown */}
          <div className="bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-2.5 text-sm">
            <div className="flex items-center justify-between text-[#706464]">
              <span>{t.subtotalLabel}</span>
              <span className="font-semibold text-[#443B3B] tabular-nums">
                {formatTND(subtotal, lang)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#706464]">
              <span>{t.deliveryLabel}</span>
              <span className="font-semibold text-[#443B3B] tabular-nums">
                {deliveryFee === 0 ? t.freeDeliveryLabel : formatTND(deliveryFee, lang)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#EADFD7] flex items-center justify-between text-base font-bold text-[#443B3B]">
              <span>{t.totalLabel}</span>
              <span className="tabular-nums" data-testid="cart-total-amount">
                {formatTND(total, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: COD Checkout Form */}
        <div className="lg:col-span-6">
          <CheckoutForm
            onSubmitOrder={handlePlaceOrder}
            submitting={submitting}
            submitError={submitError}
          />
        </div>
      </div>

      <ConfirmDialog
        open={itemToRemove !== null}
        title={t.confirmRemoveTitle}
        description={t.confirmRemoveDesc}
        confirmLabel={t.confirmBtn}
        cancelLabel={t.cancelBtn}
        destructive
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          if (itemToRemove) {
            removeItem(itemToRemove.customizationId);
            setItemToRemove(null);
          }
        }}
      />
    </div>
  );
}
