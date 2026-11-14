import React from 'react';
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { CartItem } from '../../types/cart';
import { formatTND } from '../../utils/pricing';
import { ResilientImage } from '../common/ResilientImage';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (customizationId: string, nextQty: number) => void;
  onEdit: (item: CartItem) => void;
  onRequestRemove: (item: CartItem) => void;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onEdit,
  onRequestRemove,
}: CartItemRowProps) {
  const { lang, t } = useLanguage();

  const title =
    lang === 'fr' && item.storyTitleFr
      ? item.storyTitleFr
      : lang === 'en' && item.storyTitleEn
      ? item.storyTitleEn
      : item.storyTitle;

  const bookLangLabel =
    item.language === 'ar'
      ? t.langAr
      : item.language === 'fr'
      ? t.langFr
      : t.langEn;

  return (
    <div
      data-testid={`cart-item-${item.customizationId}`}
      className="bg-white rounded-2xl border border-[#EADFD7] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5"
    >
      {/* Cover + Child Photo Thumbnail */}
      <div className="flex items-start gap-3 shrink-0">
        <div className="w-20 h-28 rounded-xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7]">
          <ResilientImage
            src={item.coverImage}
            alt={title}
            fallbackTitle={title}
            className="w-full h-full object-cover"
          />
        </div>
        {item.childPhotoBase64 && (
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7]">
            <img
              src={item.childPhotoBase64}
              alt={item.childName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-bold text-[#443B3B]">{title}</h3>
          <span className="text-base font-bold text-[#443B3B] tabular-nums">
            {formatTND(item.unitPrice * item.quantity, lang)}
          </span>
        </div>

        <div className="text-xs text-[#706464] flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[#443B3B]">{item.childName}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {item.childAge} {t.yearsUnit}
          </span>
          <span aria-hidden="true">·</span>
          <span>{bookLangLabel}</span>
          {item.storyDomain && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#443B3B]">{item.storyDomain}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatTND(item.unitPrice, lang)}</span>
        </div>

        {item.storyIdea && (
          <p className="text-xs text-[#443B3B] bg-[#F8E8DC]/50 rounded-xl px-3 py-1.5 border border-[#EADFD7]/70">
            {item.storyIdea}
          </p>
        )}

        {item.dedication && (
          <p className="text-xs text-[#706464] italic bg-[#FFF9F2] rounded-xl px-3 py-2 border border-[#EADFD7]/70">
            “{item.dedication}”
          </p>
        )}

        {/* Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-xl border border-[#EADFD7] bg-[#FFF9F2]">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.customizationId, item.quantity - 1)}
              aria-label={`Decrease quantity for ${item.childName}`}
              className="p-2 text-[#443B3B] hover:bg-[#F8E8DC] rounded-s-xl transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-xs font-bold tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.customizationId, item.quantity + 1)}
              aria-label={`Increase quantity for ${item.childName}`}
              className="p-2 text-[#443B3B] hover:bg-[#F8E8DC] rounded-e-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EADFD7] bg-white text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC]/60 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.editCustomization}</span>
            </button>
            <button
              type="button"
              onClick={() => onRequestRemove(item)}
              aria-label={`${t.removeItem} ${item.childName}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7C2C2] bg-[#FFF5F5] text-xs font-semibold text-[#8E2F2F] hover:bg-[#FCE8E8] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.removeItem}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
