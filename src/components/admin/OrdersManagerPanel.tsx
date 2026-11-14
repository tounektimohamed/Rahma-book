import React, { useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  updateOrderStatusByAdmin,
  type AdminOrderRecord,
} from '../../services/orders/ordersService';
import type { OrderStatus } from '../../types/order';
import { formatTND } from '../../utils/pricing';

interface OrdersManagerPanelProps {
  orders: AdminOrderRecord[];
  onRefresh: () => Promise<void>;
  onOpenBookStudio?: (order: AdminOrderRecord, itemIndex: number) => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'printing',
  'shipped',
  'delivered',
  'cancelled',
];

export function OrdersManagerPanel({
  orders,
  onRefresh,
  onOpenBookStudio,
}: OrdersManagerPanelProps) {
  const { lang, t } = useLanguage();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingId(orderId);
    setErrorMsg(null);
    try {
      await updateOrderStatusByAdmin(orderId, nextStatus);
      await onRefresh();
    } catch {
      setErrorMsg(t.adminSaveError);
    } finally {
      setUpdatingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EADFD7] p-10 text-center text-sm text-[#706464]">
        {t.adminOrdersEmpty}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <p className="rounded-xl bg-[#F5B8B8]/40 px-4 py-3 text-xs font-semibold text-[#8F2828]">
          {errorMsg}
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isTerminal =
            order.status === 'delivered' || order.status === 'cancelled';

          return (
            <div
              key={order.id}
              data-testid={`admin-order-card-${order.orderNumber}`}
              className="bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EADFD7]">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-[#443B3B] font-mono tabular-nums" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="text-xs text-[#706464]">
                    {order.customer.fullName} ·{' '}
                    <span dir="ltr" className="tabular-nums">
                      {order.customer.phone}
                    </span>{' '}
                    · {order.customer.governorate} ({order.customer.delegation})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#443B3B] tabular-nums">
                    {formatTND(order.total, lang)}
                  </span>
                  <select
                    aria-label={`Order status for ${order.orderNumber}`}
                    disabled={isTerminal || updatingId === order.id}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value as OrderStatus)
                    }
                    className="rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-1.5 text-xs font-semibold text-[#443B3B] disabled:opacity-60"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {order.items.map((item, idx) => (
                  <div
                    key={`${order.id}-${idx}`}
                    className="rounded-xl bg-[#FFF9F2] border border-[#EADFD7] p-3.5 flex items-start gap-3"
                  >
                    {item.childPhotoBase64 && (
                      <img
                        src={item.childPhotoBase64}
                        alt={item.childName}
                        className="w-14 h-14 rounded-xl object-cover border border-[#EADFD7] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                      <p className="font-bold text-[#443B3B]">
                        {item.childName} ({item.childAge} {t.yearsUnit}) · ×{item.quantity}
                      </p>
                      <p className="text-[#706464]">
                        {item.storyDomain ? `${item.storyDomain} · ` : ''}
                        {item.storyTitle}
                      </p>
                      {item.storyIdea && (
                        <p className="text-[#443B3B] bg-white border border-[#EADFD7] rounded-lg p-2 whitespace-pre-line">
                          {item.storyIdea}
                        </p>
                      )}
                      {item.dedication && (
                        <p className="text-[#706464] italic">“{item.dedication}”</p>
                      )}
                      {onOpenBookStudio && (
                        <div className="pt-1.5">
                          <button
                            type="button"
                            data-testid="open-in-book-studio-btn"
                            onClick={() => onOpenBookStudio(order, idx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#443B3B] text-[#FFF9F2] text-[11px] font-bold hover:bg-[#332B2B] transition-colors cursor-pointer"
                          >
                            <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t.adminOpenInEditorBtn}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
