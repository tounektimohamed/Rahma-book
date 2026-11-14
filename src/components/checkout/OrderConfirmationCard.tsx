import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { OrderConfirmation } from '../../types/order';
import { formatTND } from '../../utils/pricing';

interface OrderConfirmationCardProps {
  confirmation: OrderConfirmation;
}

export function OrderConfirmationCard({ confirmation }: OrderConfirmationCardProps) {
  const { lang, t } = useLanguage();

  return (
    <section
      data-testid="order-confirmation-screen"
      className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#EADFD7] p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#B8CDBA]/40 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#3A6342]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-[#443B3B]">{t.orderSuccessTitle}</h1>
        <p className="text-sm text-[#706464] max-w-md">{t.orderSuccessSubtitle}</p>
        <div className="px-4 py-2 rounded-xl bg-[#FFF9F2] border border-[#EADFD7] text-sm">
          <span className="text-[#706464] me-2">{t.orderNumberLabel}:</span>
          <span className="font-bold text-[#443B3B] tabular-nums" dir="ltr">
            {confirmation.orderNumber}
          </span>
        </div>
      </div>

      <div className="border-t border-[#EADFD7] pt-5 space-y-4">
        <h2 className="text-base font-bold text-[#443B3B]">{t.orderSummaryTitle}</h2>

        <div className="space-y-3">
          {confirmation.items.map((item, index) => (
            <div
              key={`${item.storyId}-${item.childName}-${index}`}
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#FFF9F2] border border-[#EADFD7]/70"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.childPhotoBase64 && (
                  <img
                    src={item.childPhotoBase64}
                    alt={item.childName}
                    className="w-11 h-11 rounded-lg object-cover border border-[#EADFD7] shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#443B3B] truncate">{item.storyTitle}</p>
                  <p className="text-xs text-[#706464]">
                    {item.childName} · {item.childAge} {t.yearsUnit} · ×{item.quantity}
                    {item.storyDomain ? ` · ${item.storyDomain}` : ''}
                  </p>
                  {item.storyIdea && (
                    <p className="text-xs text-[#706464] truncate">{item.storyIdea}</p>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-[#443B3B] tabular-nums shrink-0">
                {formatTND(item.unitPrice * item.quantity, lang)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#F8E8DC]/50 p-4 text-sm space-y-1.5">
          <p className="font-semibold text-[#443B3B]">{confirmation.customer.fullName}</p>
          <p className="text-[#706464]">
            <span dir="ltr" className="tabular-nums inline-block">
              {confirmation.customer.phone}
            </span>
          </p>
          <p className="text-[#706464]">
            {confirmation.customer.governorate} · {confirmation.customer.delegation} ·{' '}
            {confirmation.customer.address}
          </p>
        </div>

        <div className="border-t border-[#EADFD7] pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-[#706464]">
            <span>{t.subtotalLabel}</span>
            <span className="tabular-nums">{formatTND(confirmation.subtotal, lang)}</span>
          </div>
          <div className="flex justify-between text-[#706464]">
            <span>{t.deliveryLabel}</span>
            <span className="tabular-nums">
              {confirmation.deliveryFee === 0
                ? t.freeDeliveryLabel
                : formatTND(confirmation.deliveryFee, lang)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-[#443B3B] pt-2 border-t border-[#EADFD7]">
            <span>{t.totalLabel}</span>
            <span className="tabular-nums">{formatTND(confirmation.total, lang)}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-center">
        <Link
          to="/stories"
          className="px-6 py-3 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold hover:bg-[#EE9E9E] transition-colors"
        >
          {t.continueShopping}
        </Link>
      </div>
    </section>
  );
}
