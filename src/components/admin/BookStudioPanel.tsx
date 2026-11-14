import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Copy,
  Download,
  FilePlus2,
  MoveLeft,
  MoveRight,
  Pencil,
  Printer,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { useLanguage } from '../../context/LanguageContext';
import {
  updateOrderStatusByAdmin,
  type AdminOrderRecord,
} from '../../services/orders/ordersService';
import {
  loadStudioProject,
  saveStudioProject,
} from '../../services/bookStudio/bookStudioStorage';
import type { OrderStatus } from '../../types/order';
import type { Story } from '../../types/story';
import {
  addPageToProject,
  applyStyleToAllPages,
  BOOK_SIZE_PRESETS,
  buildBookletImpositionSheets,
  buildBookProjectFromOrderItem,
  createBlankBookProject,
  deletePageFromProject,
  duplicatePageInProject,
  getOrderProjectKey,
  moveContentPage,
  padPagesForBooklet,
  PAGE_STYLE_PRESETS,
  parseBookProjectJson,
  PRINT_PAPER_OPTIONS,
  renderBookPageHtml,
  type BookFontFamily,
  type BookImageFit,
  type BookPage,
  type BookPageLayout,
  type BookTextAlign,
  type ChildBadgeCorner,
  type StoryBookProject,
} from '../../utils/bookStudio';
import { resolveStoryAssetUrl } from '../../utils/storyAssets';
import { BookStudioPageCanvas } from './BookStudioPageCanvas';

export interface StudioOrderTarget {
  orderId: string;
  itemIndex: number;
}

interface BookStudioPanelProps {
  orders: AdminOrderRecord[];
  stories: Story[];
  selectedTarget: StudioOrderTarget | null;
  onSelectTarget: (target: StudioOrderTarget | null) => void;
  onOrderUpdated: () => Promise<void>;
}

type StudioSubTab = 'edit' | 'flip' | 'print';
type PrintLayoutType = 'booklet' | 'single';
type PrintSidesMode = 'all' | 'f' | 'b';

const CUSTOM_DRAFT_KEY = 'custom:latest';
const FONT_OPTIONS: BookFontFamily[] = [
  'Cairo',
  'Tajawal',
  'Amiri',
  'Reem Kufi',
  'Lemonada',
  'Poppins',
];
const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'printing',
  'shipped',
  'delivered',
  'cancelled',
];

export function BookStudioPanel({
  orders,
  stories,
  selectedTarget,
  onSelectTarget,
  onOrderUpdated,
}: BookStudioPanelProps) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const [project, setProject] = useState<StoryBookProject>(() =>
    createBlankBookProject({ contentPagesCount: 8, rtl: true })
  );
  const [undoStack, setUndoStack] = useState<StoryBookProject[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [subTab, setSubTab] = useState<StudioSubTab>('edit');
  const [setupOpen, setSetupOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Print controls
  const [paperSizeId, setPaperSizeId] = useState<string>('297,210');
  const [printLayout, setPrintLayout] = useState<PrintLayoutType>('booklet');
  const [printMode, setPrintMode] = useState<PrintSidesMode>('all');
  const [showFoldGuides, setShowFoldGuides] = useState(true);

  // PageFlip container
  const flipWrapperRef = useRef<HTMLDivElement>(null);
  const flipInstanceRef = useRef<PageFlip | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const hydratedKeyRef = useRef<string | null>(null);

  // Setup modal state synced from active project
  const [setupTitle, setSetupTitle] = useState(project.title);
  const [setupAuthor, setSetupAuthor] = useState(project.author);
  const [setupWidth, setSetupWidth] = useState(project.w);
  const [setupHeight, setSetupHeight] = useState(project.h);
  const [setupRtl, setSetupRtl] = useState(project.rtl);
  const [setupPagesCount, setSetupPagesCount] = useState(Math.max(1, project.pages.length - 2));

  const activeStorageKey = useMemo(() => {
    if (selectedTarget) {
      return getOrderProjectKey(selectedTarget.orderId, selectedTarget.itemIndex);
    }
    return CUSTOM_DRAFT_KEY;
  }, [selectedTarget]);

  // Flat list of all ordered items for quick linking
  const orderedItemOptions = useMemo(() => {
    const list: Array<{
      key: string;
      order: AdminOrderRecord;
      itemIndex: number;
      label: string;
    }> = [];
    for (const order of orders) {
      order.items.forEach((item, itemIndex) => {
        list.push({
          key: `${order.id}:${itemIndex}`,
          order,
          itemIndex,
          label: `${order.orderNumber} — ${item.childName} — ${item.storyTitle}`,
        });
      });
    }
    return list;
  }, [orders]);

  const linkedOrderRecord = useMemo(() => {
    if (!selectedTarget) return null;
    return orders.find((o) => o.id === selectedTarget.orderId) || null;
  }, [orders, selectedTarget]);

  const linkedOrderItem = useMemo(() => {
    if (!linkedOrderRecord || !selectedTarget) return null;
    return linkedOrderRecord.items[selectedTarget.itemIndex] || null;
  }, [linkedOrderRecord, selectedTarget]);

  // Load saved IndexedDB project or auto-build from selected ordered book
  useEffect(() => {
    if (hydratedKeyRef.current === activeStorageKey) {
      return;
    }

    let cancelled = false;

    async function hydrate() {
      const saved = await loadStudioProject(activeStorageKey);
      if (cancelled) return;

      if (saved) {
        hydratedKeyRef.current = activeStorageKey;
        setProject(saved);
        setCurrentPageIdx(0);
        setUndoStack([]);
        return;
      }

      if (selectedTarget) {
        const order = orders.find((o) => o.id === selectedTarget.orderId);
        if (order && order.items[selectedTarget.itemIndex]) {
          const item = order.items[selectedTarget.itemIndex];
          const story = stories.find((s) => s.id === item.storyId) || null;
          const generated = buildBookProjectFromOrderItem({
            order,
            itemIndex: selectedTarget.itemIndex,
            story,
            resolveImageUrl: resolveStoryAssetUrl,
          });
          hydratedKeyRef.current = activeStorageKey;
          setProject(generated);
          setCurrentPageIdx(0);
          setUndoStack([]);
          await saveStudioProject(activeStorageKey, generated);
          return;
        }
        return;
      }

      hydratedKeyRef.current = activeStorageKey;
      const fresh = createBlankBookProject({ contentPagesCount: 8, rtl: true });
      setProject(fresh);
      setCurrentPageIdx(0);
      setUndoStack([]);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [activeStorageKey, selectedTarget, orders, stories]);

  // Persist changes smoothly into IndexedDB
  const persistProject = useCallback(
    (next: StoryBookProject) => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveStudioProject(activeStorageKey, next);
      }, 300);
    },
    [activeStorageKey]
  );

  const commitProjectChange = useCallback(
    (updater: (prev: StoryBookProject) => StoryBookProject, recordUndo = true) => {
      setProject((prev) => {
        if (recordUndo) {
          setUndoStack((u) => [...u.slice(-19), prev]);
        }
        const next = updater(prev);
        persistProject(next);
        return next;
      });
    },
    [persistProject]
  );

  const handleUndo = () => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1];
      setProject(previous);
      persistProject(previous);
      setCurrentPageIdx((idx) => Math.min(idx, previous.pages.length - 1));
      return stack.slice(0, -1);
    });
  };

  const currentPage: BookPage =
    project.pages[currentPageIdx] || project.pages[0];

  const updateCurrentPage = (
    patch: Partial<BookPage>,
    recordUndo = true
  ) => {
    commitProjectChange(
      (prev) => ({
        ...prev,
        pages: prev.pages.map((pg, idx) =>
          idx === currentPageIdx ? { ...pg, ...patch } : pg
        ),
        updatedAt: new Date().toISOString(),
      }),
      recordUndo
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        updateCurrentPage({ img: dataUrl, imgZoom: 1, imgPosX: 50, imgPosY: 50 });
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetFromLinkedOrder = async () => {
    if (!linkedOrderRecord || !selectedTarget) return;
    const item = linkedOrderRecord.items[selectedTarget.itemIndex];
    if (!item) return;
    const story = stories.find((s) => s.id === item.storyId) || null;
    const rebuilt = buildBookProjectFromOrderItem({
      order: linkedOrderRecord,
      itemIndex: selectedTarget.itemIndex,
      story,
      resolveImageUrl: resolveStoryAssetUrl,
    });
    setUndoStack((u) => [...u.slice(-19), project]);
    setProject(rebuilt);
    setCurrentPageIdx(0);
    await saveStudioProject(activeStorageKey, rebuilt);
    setStatusNotice(
      isAr
        ? 'تمت إعادة تعبئة الصفحات تلقائياً من بيانات الطلب.'
        : 'Book project rebuilt from order details.'
    );
  };

  const handleOrderStatusQuickChange = async (nextStatus: OrderStatus) => {
    if (!linkedOrderRecord) return;
    setUpdatingOrderStatus(true);
    try {
      await updateOrderStatusByAdmin(linkedOrderRecord.id, nextStatus);
      await onOrderUpdated();
      setStatusNotice(
        isAr ? `تم تحديث حالة الطلب إلى: ${nextStatus}` : `Order status updated: ${nextStatus}`
      );
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (project.linkedOrder?.orderNumber || project.title || 'storybook')
      .replace(/[^a-zA-Z0-9_-]+/g, '-');
    a.href = url;
    a.download = `${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = parseBookProjectJson(String(reader.result || ''));
      if (!imported) {
        setStatusNotice(
          isAr ? 'ملف JSON غير صالح لمشروع كتاب.' : 'Invalid book project JSON.'
        );
        return;
      }
      setUndoStack((u) => [...u.slice(-19), project]);
      setProject(imported);
      setCurrentPageIdx(0);
      persistProject(imported);
      setStatusNotice(isAr ? 'تم استيراد مشروع الكتاب بنجاح.' : 'Book project imported.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openSetupModal = () => {
    setSetupTitle(project.title);
    setSetupAuthor(project.author);
    setSetupWidth(project.w);
    setSetupHeight(project.h);
    setSetupRtl(project.rtl);
    setSetupPagesCount(Math.max(1, project.pages.length - 2));
    setSetupOpen(true);
  };

  const applySetupChanges = (asBrandNew: boolean) => {
    if (asBrandNew) {
      onSelectTarget(null);
      const blank = createBlankBookProject({
        title: setupTitle,
        author: setupAuthor,
        contentPagesCount: setupPagesCount,
        w: setupWidth,
        h: setupHeight,
        rtl: setupRtl,
      });
      setProject(blank);
      setCurrentPageIdx(0);
      setUndoStack([]);
      saveStudioProject(CUSTOM_DRAFT_KEY, blank);
    } else {
      commitProjectChange((prev) => {
        const currentContent = prev.pages.slice(1, prev.pages.length - 1);
        const targetContentCount = Math.max(1, Math.min(60, setupPagesCount));
        let nextContent = [...currentContent];
        if (nextContent.length < targetContentCount) {
          while (nextContent.length < targetContentCount) {
            nextContent.push(
              createBlankBookProject({ rtl: setupRtl }).pages[1]
            );
          }
        } else if (nextContent.length > targetContentCount) {
          nextContent = nextContent.slice(0, targetContentCount);
        }
        return {
          ...prev,
          title: setupTitle.trim() || prev.title,
          author: setupAuthor.trim(),
          w: Math.max(80, Math.min(400, setupWidth)),
          h: Math.max(80, Math.min(400, setupHeight)),
          rtl: setupRtl,
          pages: [prev.pages[0], ...nextContent, prev.pages[prev.pages.length - 1]],
          updatedAt: new Date().toISOString(),
        };
      });
      setCurrentPageIdx(0);
    }
    setSetupOpen(false);
  };

  // Mount PageFlip when switching to 3D flipbook preview tab
  useEffect(() => {
    if (subTab !== 'flip' || !flipWrapperRef.current) return;
    const wrapper = flipWrapperRef.current;

    try {
      flipInstanceRef.current?.destroy();
    } catch {
      // Ignore destroy errors
    }
    flipInstanceRef.current = null;
    wrapper.innerHTML = '';

    const container = document.createElement('div');
    wrapper.appendChild(container);

    const padded = padPagesForBooklet(project.pages);
    const indices = padded.map((_, i) => i);
    if (project.rtl) {
      indices.reverse();
    }

    indices.forEach((pageIndex, orderIdx) => {
      const pageEl = document.createElement('div');
      pageEl.className = 'bg-white overflow-hidden';
      if (orderIdx === 0 || orderIdx === indices.length - 1) {
        pageEl.dataset.density = 'hard';
      }
      pageEl.innerHTML = renderBookPageHtml(padded[pageIndex], {
        rtl: project.rtl,
        childPhotoAsset: project.childPhotoAsset,
        resolveImageUrl: resolveStoryAssetUrl,
      });
      container.appendChild(pageEl);
    });

    const instance = new PageFlip(container, {
      width: 340,
      height: Math.round((340 * project.h) / project.w),
      size: 'stretch',
      minWidth: 160,
      maxWidth: 620,
      minHeight: 160,
      maxHeight: 900,
      showCover: true,
      usePortrait: true,
      maxShadowOpacity: 0.45,
      mobileScrollSupport: false,
    });

    instance.loadFromHTML(container.querySelectorAll(':scope > div'));
    if (project.rtl) {
      instance.turnToPage(indices.length - 1);
    }
    flipInstanceRef.current = instance;

    return () => {
      try {
        instance.destroy();
      } catch {
        // Ignore cleanup errors
      }
      flipInstanceRef.current = null;
    };
  }, [subTab, project]);

  const paddedPages = useMemo(() => padPagesForBooklet(project.pages), [project.pages]);
  const impositionSheets = useMemo(
    () => buildBookletImpositionSheets(paddedPages.length, project.rtl),
    [paddedPages.length, project.rtl]
  );
  const [paperW, paperH] = useMemo(() => {
    const parts = paperSizeId.split(',').map(Number);
    return [parts[0] || 297, parts[1] || 210];
  }, [paperSizeId]);

  const printFitsPaper =
    printLayout === 'single'
      ? project.w <= paperW && project.h <= paperH
      : 2 * project.w <= paperW && project.h <= paperH;

  const pageLabel = (idx: number) => {
    if (idx === 0) return isAr ? 'الغلاف الأمامي' : 'Front Cover';
    if (idx === project.pages.length - 1) return isAr ? 'الغلاف الخلفي' : 'Back Cover';
    return isAr ? `صفحة ${idx}` : `Page ${idx}`;
  };

  return (
    <div className="space-y-5" data-testid="book-studio-panel">
      {/* Dynamic @page print rule when on print tab */}
      {subTab === 'print' && (
        <style>{`
          @page { size: ${
            printLayout === 'single' ? `${project.w}mm ${project.h}mm` : `${paperW}mm ${paperH}mm`
          }; margin: 0; }
          @media print {
            body { background: #fff !important; }
            .mls-print-sheet { width: ${paperW}mm !important; height: ${paperH}mm !important; border: 0 !important; margin: 0 !important; break-after: page; }
            .mls-print-sheet:last-child { break-after: auto; }
            .mls-print-single { width: ${project.w}mm !important; height: ${project.h}mm !important; border: 0 !important; margin: 0 !important; break-after: page; }
            .mls-print-single:last-child { break-after: auto; }
          }
        `}</style>
      )}

      {/* Top Studio Order-Linker & Project Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EADFD7] p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="studio-order-select"
              className="text-xs font-bold text-[#443B3B] whitespace-nowrap"
            >
              {isAr ? 'ربط بطلب عميل:' : 'Link Ordered Book:'}
            </label>
            <select
              id="studio-order-select"
              data-testid="studio-order-selector"
              value={selectedTarget ? `${selectedTarget.orderId}:${selectedTarget.itemIndex}` : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  onSelectTarget(null);
                  return;
                }
                const [orderId, idxStr] = val.split(':');
                onSelectTarget({ orderId, itemIndex: Number(idxStr) || 0 });
              }}
              className="rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs font-semibold text-[#443B3B] min-w-[240px]"
            >
              <option value="">
                {isAr ? '— مشروع تصميم حر (غير مرتبط بطلب) —' : '— Standalone Draft Book —'}
              </option>
              {orderedItemOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            {linkedOrderRecord && (
              <button
                type="button"
                onClick={handleResetFromLinkedOrder}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'توليد تلقائي من الطلب' : 'Rebuild from Order'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] disabled:opacity-45 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'تراجع' : 'Undo'}</span>
            </button>

            <button
              type="button"
              onClick={openSetupModal}
              data-testid="studio-settings-btn"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إعدادات الكتاب / جديد' : 'Book Setup / New'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EADFD7] bg-white text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'تصدير JSON' : 'Export JSON'}</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EADFD7] bg-white text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'استيراد' : 'Import'}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Linked Customer Order Briefing Bar */}
        {linkedOrderRecord && linkedOrderItem && (
          <div
            data-testid="studio-linked-order-banner"
            className="rounded-2xl bg-[#FFF9F2] border border-[#EADFD7] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {linkedOrderItem.childPhotoBase64 && (
                <img
                  src={linkedOrderItem.childPhotoBase64}
                  alt={linkedOrderItem.childName}
                  className="w-14 h-14 rounded-xl object-cover border border-[#EADFD7] shrink-0"
                />
              )}
              <div className="min-w-0 space-y-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#443B3B]" dir="ltr">
                    {linkedOrderRecord.orderNumber}
                  </span>
                  <span className="font-bold text-[#443B3B]">
                    {linkedOrderItem.childName} ({linkedOrderItem.childAge})
                  </span>
                  <span className="text-[#706464]">
                    · {linkedOrderItem.storyTitle}
                    {linkedOrderItem.storyDomain ? ` (${linkedOrderItem.storyDomain})` : ''}
                  </span>
                </div>
                {linkedOrderItem.dedication && (
                  <p className="text-[#706464] italic line-clamp-1">
                    “{linkedOrderItem.dedication}”
                  </p>
                )}
                {linkedOrderItem.storyIdea && (
                  <p className="text-[#443B3B] line-clamp-2">{linkedOrderItem.storyIdea}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {linkedOrderItem.childPhotoBase64 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      updateCurrentPage({
                        img: linkedOrderItem.childPhotoBase64,
                        imgZoom: 1,
                        imgPosX: 50,
                        imgPosY: 50,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer"
                  >
                    {isAr ? 'وضع صورة الطفل كخلفية' : 'Use Child Photo as Page Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateCurrentPage({
                        showChildBadge: !currentPage.showChildBadge,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#EADFD7] bg-white text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                  >
                    {currentPage.showChildBadge
                      ? isAr
                        ? 'إخفاء شارة الطفل'
                        : 'Hide Child Badge'
                      : isAr
                      ? 'إظهار شارة صورة الطفل'
                      : 'Show Child Portrait Badge'}
                  </button>
                </>
              )}

              <select
                aria-label="Update linked order status"
                disabled={
                  updatingOrderStatus ||
                  linkedOrderRecord.status === 'delivered' ||
                  linkedOrderRecord.status === 'cancelled'
                }
                value={linkedOrderRecord.status}
                onChange={(e) =>
                  handleOrderStatusQuickChange(e.target.value as OrderStatus)
                }
                className="rounded-xl border border-[#EADFD7] bg-white px-2.5 py-1.5 text-xs font-bold text-[#443B3B]"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {statusNotice && (
          <p className="rounded-xl bg-[#B8CDBA]/35 px-3.5 py-2 text-xs font-semibold text-[#2E5436]">
            {statusNotice}
          </p>
        )}

        {/* Sub-Tabs: Edit / 3D Flipbook / Print */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EADFD7]">
          <button
            type="button"
            onClick={() => setSubTab('edit')}
            data-testid="studio-tab-edit"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'edit'
                ? 'bg-[#443B3B] text-[#FFF9F2]'
                : 'bg-[#FFF9F2] text-[#443B3B] border border-[#EADFD7] hover:bg-[#F8E8DC]'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'تحرير الصفحات' : 'Edit Pages'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('flip')}
            data-testid="studio-tab-flip"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'flip'
                ? 'bg-[#443B3B] text-[#FFF9F2]'
                : 'bg-[#FFF9F2] text-[#443B3B] border border-[#EADFD7] hover:bg-[#F8E8DC]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'معاينة وتقليب الكتاب' : '3D Flipbook Preview'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('print')}
            data-testid="studio-tab-print"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              subTab === 'print'
                ? 'bg-[#443B3B] text-[#FFF9F2]'
                : 'bg-[#FFF9F2] text-[#443B3B] border border-[#EADFD7] hover:bg-[#F8E8DC]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'طباعة وملزمة PDF' : 'Print & Imposition'}</span>
          </button>

          <span className="text-xs text-[#706464] ms-auto tabular-nums">
            {project.title} · {project.w}×{project.h}mm ·{' '}
            {project.rtl ? 'RTL' : 'LTR'} · {project.pages.length}{' '}
            {isAr ? 'صفحة' : 'pages'}
          </span>
        </div>
      </div>

      {/* EDIT WORKSPACE */}
      {subTab === 'edit' && (
        <div className="space-y-4 print:hidden">
          {/* Page Thumbnail Strip + Page Management Actions */}
          <div className="bg-white rounded-2xl border border-[#EADFD7] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const res = addPageToProject(project, currentPageIdx);
                    commitProjectChange(() => res.project);
                    setCurrentPageIdx(res.nextIndex);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EADFD7] bg-[#FFF9F2] text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] cursor-pointer"
                >
                  <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? '+ صفحة' : '+ Page'}</span>
                </button>

                <button
                  type="button"
                  disabled={
                    currentPageIdx === 0 ||
                    currentPageIdx === project.pages.length - 1
                  }
                  onClick={() => {
                    const res = duplicatePageInProject(project, currentPageIdx);
                    commitProjectChange(() => res.project);
                    setCurrentPageIdx(res.nextIndex);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EADFD7] bg-white text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] disabled:opacity-45 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'نسخ' : 'Duplicate'}</span>
                </button>

                <button
                  type="button"
                  disabled={
                    currentPageIdx <= 1 ||
                    currentPageIdx >= project.pages.length - 1
                  }
                  onClick={() => {
                    const res = moveContentPage(project, currentPageIdx, -1);
                    commitProjectChange(() => res.project);
                    setCurrentPageIdx(res.nextIndex);
                  }}
                  aria-label="Move page earlier"
                  className="p-1.5 rounded-lg border border-[#EADFD7] bg-white text-[#443B3B] hover:bg-[#F8E8DC] disabled:opacity-45 cursor-pointer"
                >
                  <MoveRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  disabled={
                    currentPageIdx <= 0 ||
                    currentPageIdx >= project.pages.length - 2
                  }
                  onClick={() => {
                    const res = moveContentPage(project, currentPageIdx, 1);
                    commitProjectChange(() => res.project);
                    setCurrentPageIdx(res.nextIndex);
                  }}
                  aria-label="Move page later"
                  className="p-1.5 rounded-lg border border-[#EADFD7] bg-white text-[#443B3B] hover:bg-[#F8E8DC] disabled:opacity-45 cursor-pointer"
                >
                  <MoveLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  disabled={
                    project.pages.length <= 3 ||
                    currentPageIdx === 0 ||
                    currentPageIdx === project.pages.length - 1
                  }
                  onClick={() => {
                    const res = deletePageFromProject(project, currentPageIdx);
                    commitProjectChange(() => res.project);
                    setCurrentPageIdx(res.nextIndex);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E7C2C2] bg-[#FFF5F5] text-xs font-semibold text-[#8E2F2F] hover:bg-[#FCE8E8] disabled:opacity-45 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'حذف' : 'Delete'}</span>
                </button>
              </div>
              <span className="text-xs font-semibold text-[#706464]">
                {pageLabel(currentPageIdx)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {project.pages.map((pg, idx) => {
                const label =
                  idx === 0
                    ? isAr
                      ? 'غ'
                      : 'C'
                    : idx === project.pages.length - 1
                    ? isAr
                      ? 'خ'
                      : 'B'
                    : String(idx);
                const hasContent = Boolean(pg.img || pg.text.trim());
                return (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => setCurrentPageIdx(idx)}
                    className={`relative min-w-11 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      idx === currentPageIdx
                        ? 'bg-[#443B3B] text-[#FFF9F2]'
                        : 'bg-[#FFF9F2] border border-[#EADFD7] text-[#443B3B] hover:bg-[#F8E8DC]'
                    }`}
                  >
                    {label}
                    {hasContent && (
                      <span
                        aria-hidden="true"
                        className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-[#3AA05A]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Two-Column Canvas + Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Interactive Canvas */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-3">
              <div
                data-testid="studio-live-canvas"
                style={{ aspectRatio: `${project.w} / ${project.h}` }}
                className="w-full max-w-[380px] mx-auto rounded-xl overflow-hidden shadow-md border border-[#EADFD7] bg-white"
              >
                <BookStudioPageCanvas
                  page={currentPage}
                  rtl={project.rtl}
                  childPhotoAsset={project.childPhotoAsset}
                  interactive
                  onMoveTextBox={(x, y) => updateCurrentPage({ x, y }, false)}
                  onCommitDrag={() => {
                    setProject((latest) => {
                      saveStudioProject(activeStorageKey, latest);
                      return latest;
                    });
                  }}
                />
              </div>
              <p className="text-center text-xs text-[#706464]">
                {pageLabel(currentPageIdx)} ·{' '}
                {currentPage.layout === 'over'
                  ? isAr
                    ? 'يمكنك سحب صندوق النص مباشرة فوق الصورة'
                    : 'Drag text box directly on the page'
                  : isAr
                  ? 'نمط الصورة أعلى والنص أسفل'
                  : 'Split top-image / bottom-text layout'}
              </p>
            </div>

            {/* Inspector Tools */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-5">
              {/* Quick Style Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#443B3B]">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'قوالب تنسيق سريعة:' : 'Quick Style Presets:'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PAGE_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => updateCurrentPage(preset.patch)}
                      className="px-3 py-1.5 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                    >
                      {isAr ? preset.labelAr : preset.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Image Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#EADFD7]">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'صورة الصفحة (رفع أو تغيير)' : 'Page Image'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="text-xs file:me-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#443B3B] file:text-[#FFF9F2] file:text-xs file:font-bold"
                    />
                    {currentPage.img && (
                      <button
                        type="button"
                        onClick={() => updateCurrentPage({ img: '' })}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E7C2C2] bg-[#FFF5F5] text-xs font-semibold text-[#8E2F2F] shrink-0 cursor-pointer"
                      >
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#443B3B]">
                      {isAr ? 'ملاءمة الصورة' : 'Image Fit'}
                    </label>
                    <select
                      value={currentPage.fit}
                      onChange={(e) =>
                        updateCurrentPage({ fit: e.target.value as BookImageFit })
                      }
                      className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-2.5 py-2 text-xs text-[#443B3B]"
                    >
                      <option value="cover">{isAr ? 'ملء (Cover)' : 'Cover'}</option>
                      <option value="contain">{isAr ? 'احتواء (Contain)' : 'Contain'}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#443B3B]">
                      {isAr ? `تقريب: ${currentPage.imgZoom.toFixed(1)}×` : `Zoom: ${currentPage.imgZoom.toFixed(1)}×`}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={2}
                      step={0.05}
                      value={currentPage.imgZoom}
                      onChange={(e) =>
                        updateCurrentPage({ imgZoom: Number(e.target.value) })
                      }
                      className="w-full accent-[#443B3B]"
                    />
                  </div>
                </div>

                {currentPage.img && (
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#706464] tabular-nums">
                        {isAr ? `إزاحة أفقية (${currentPage.imgPosX}%)` : `Pan X (${currentPage.imgPosX}%)`}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={currentPage.imgPosX}
                        onChange={(e) =>
                          updateCurrentPage({ imgPosX: Number(e.target.value) })
                        }
                        className="w-full accent-[#443B3B]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#706464] tabular-nums">
                        {isAr ? `إزاحة عمودية (${currentPage.imgPosY}%)` : `Pan Y (${currentPage.imgPosY}%)`}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={currentPage.imgPosY}
                        onChange={(e) =>
                          updateCurrentPage({ imgPosY: Number(e.target.value) })
                        }
                        className="w-full accent-[#443B3B]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <label
                  htmlFor="studio-page-text"
                  className="block text-xs font-semibold text-[#443B3B]"
                >
                  {isAr ? 'نص الصفحة' : 'Page Text'}
                </label>
                <textarea
                  id="studio-page-text"
                  rows={3}
                  value={currentPage.text}
                  onChange={(e) => updateCurrentPage({ text: e.target.value })}
                  placeholder={isAr ? 'اكتب أو الصق نص هذه الصفحة هنا...' : 'Write page text...'}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
                />
              </div>

              {/* Typography & Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'الخط' : 'Font'}
                  </label>
                  <select
                    value={currentPage.font}
                    onChange={(e) =>
                      updateCurrentPage({ font: e.target.value as BookFontFamily })
                    }
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-2.5 py-2 text-xs text-[#443B3B]"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'التخطيط' : 'Layout'}
                  </label>
                  <select
                    value={currentPage.layout}
                    onChange={(e) =>
                      updateCurrentPage({ layout: e.target.value as BookPageLayout })
                    }
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-2.5 py-2 text-xs text-[#443B3B]"
                  >
                    <option value="over">{isAr ? 'نص فوق الصورة' : 'Text Over Image'}</option>
                    <option value="split">{isAr ? 'صورة أعلى ونص أسفل' : 'Split Top/Bottom'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'المحاذاة' : 'Align'}
                  </label>
                  <select
                    value={currentPage.al}
                    onChange={(e) =>
                      updateCurrentPage({ al: e.target.value as BookTextAlign })
                    }
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-2.5 py-2 text-xs text-[#443B3B]"
                  >
                    <option value="right">{isAr ? 'يمين' : 'Right'}</option>
                    <option value="center">{isAr ? 'وسط' : 'Center'}</option>
                    <option value="left">{isAr ? 'يسار' : 'Left'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B] tabular-nums">
                    {isAr ? `حجم الخط (${currentPage.size})` : `Font Size (${currentPage.size})`}
                  </label>
                  <input
                    type="range"
                    min={2}
                    max={14}
                    step={0.2}
                    value={currentPage.size}
                    onChange={(e) => updateCurrentPage({ size: Number(e.target.value) })}
                    className="w-full accent-[#443B3B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B] tabular-nums">
                    {isAr ? `عرض الصندوق (${currentPage.w}%)` : `Box Width (${currentPage.w}%)`}
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={1}
                    value={currentPage.w}
                    onChange={(e) => updateCurrentPage({ w: Number(e.target.value) })}
                    className="w-full accent-[#443B3B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B] tabular-nums">
                    {isAr ? `تباعد الأسطر (${currentPage.lineHeight})` : `Line Height (${currentPage.lineHeight})`}
                  </label>
                  <input
                    type="range"
                    min={1.1}
                    max={2.2}
                    step={0.05}
                    value={currentPage.lineHeight}
                    onChange={(e) =>
                      updateCurrentPage({ lineHeight: Number(e.target.value) })
                    }
                    className="w-full accent-[#443B3B]"
                  />
                </div>
              </div>

              {/* Colors & Box Styling */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'لون النص' : 'Text Color'}
                  </label>
                  <input
                    type="color"
                    value={currentPage.color}
                    onChange={(e) => updateCurrentPage({ color: e.target.value })}
                    className="w-full h-9 rounded-lg border border-[#EADFD7] p-0.5 bg-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B]">
                    {isAr ? 'لون الخلفية' : 'Box Bg'}
                  </label>
                  <input
                    type="color"
                    value={currentPage.bg}
                    onChange={(e) => updateCurrentPage({ bg: e.target.value })}
                    className="w-full h-9 rounded-lg border border-[#EADFD7] p-0.5 bg-white cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B] tabular-nums">
                    {isAr ? `الشفافية (${Math.round(currentPage.a * 100)}%)` : `Opacity (${Math.round(currentPage.a * 100)}%)`}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={currentPage.a}
                    onChange={(e) => updateCurrentPage({ a: Number(e.target.value) })}
                    className="w-full accent-[#443B3B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#443B3B] tabular-nums">
                    {isAr ? `استدارة (${currentPage.radius})` : `Radius (${currentPage.radius})`}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.5}
                    value={currentPage.radius}
                    onChange={(e) => updateCurrentPage({ radius: Number(e.target.value) })}
                    className="w-full accent-[#443B3B]"
                  />
                </div>
              </div>

              {/* Toggles & Quick Position */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#443B3B]">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.bold}
                    onChange={(e) => updateCurrentPage({ bold: e.target.checked })}
                    className="accent-[#443B3B]"
                  />
                  <span>{isAr ? 'خط عريض' : 'Bold'}</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.textShadow}
                    onChange={(e) => updateCurrentPage({ textShadow: e.target.checked })}
                    className="accent-[#443B3B]"
                  />
                  <span>{isAr ? 'ظل للنص' : 'Text Shadow'}</span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.frameBorder}
                    onChange={(e) => updateCurrentPage({ frameBorder: e.target.checked })}
                    className="accent-[#443B3B]"
                  />
                  <span>{isAr ? 'إطار كلاسيكي للصفحة' : 'Page Frame'}</span>
                </label>

                <div className="flex items-center gap-1.5 ms-auto">
                  <span className="text-[#706464]">{isAr ? 'الموضع:' : 'Pos:'}</span>
                  {[
                    { y: 6, label: isAr ? 'أعلى' : 'Top' },
                    { y: 40, label: isAr ? 'وسط' : 'Mid' },
                    { y: 72, label: isAr ? 'أسفل' : 'Bottom' },
                  ].map((pos) => (
                    <button
                      key={pos.y}
                      type="button"
                      onClick={() =>
                        updateCurrentPage({ y: pos.y, x: (100 - currentPage.w) / 2 })
                      }
                      className="px-2.5 py-1 rounded-lg border border-[#EADFD7] bg-[#FFF9F2] hover:bg-[#F8E8DC] cursor-pointer"
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Child Photo PIP Badge Controls when linked to an ordered book */}
              {project.childPhotoAsset && (
                <div className="rounded-xl bg-[#FFF9F2] border border-[#EADFD7] p-3 flex flex-wrap items-center gap-3 text-xs">
                  <label className="inline-flex items-center gap-1.5 font-bold text-[#443B3B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentPage.showChildBadge}
                      onChange={(e) =>
                        updateCurrentPage({ showChildBadge: e.target.checked })
                      }
                      className="accent-[#443B3B]"
                    />
                    <span>{isAr ? 'شارة دائرية لصورة الطفل' : 'Child Portrait Badge'}</span>
                  </label>
                  {currentPage.showChildBadge && (
                    <>
                      <select
                        value={currentPage.childBadgeCorner}
                        onChange={(e) =>
                          updateCurrentPage({
                            childBadgeCorner: e.target.value as ChildBadgeCorner,
                          })
                        }
                        className="rounded-lg border border-[#EADFD7] bg-white px-2 py-1 text-xs"
                      >
                        <option value="top-right">{isAr ? 'أعلى يمين' : 'Top Right'}</option>
                        <option value="top-left">{isAr ? 'أعلى يسار' : 'Top Left'}</option>
                        <option value="bottom-center">{isAr ? 'أسفل وسط' : 'Bottom Center'}</option>
                      </select>
                      <div className="flex items-center gap-1.5">
                        <span>{isAr ? 'الحجم:' : 'Size:'}</span>
                        <input
                          type="range"
                          min={14}
                          max={40}
                          step={1}
                          value={currentPage.childBadgeSize}
                          onChange={(e) =>
                            updateCurrentPage({ childBadgeSize: Number(e.target.value) })
                          }
                          className="w-24 accent-[#443B3B]"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Apply Styling Across Pages */}
              <div className="pt-3 border-t border-[#EADFD7] flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    commitProjectChange((prev) =>
                      applyStyleToAllPages(prev, currentPageIdx, 'content')
                    )
                  }
                  className="px-4 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                >
                  {isAr
                    ? 'تطبيق التنسيق على صفحات المحتوى'
                    : 'Apply Style to Content Pages'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    commitProjectChange((prev) =>
                      applyStyleToAllPages(prev, currentPageIdx, 'all')
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold hover:bg-[#332B2B] transition-colors cursor-pointer"
                >
                  {isAr
                    ? 'تطبيق التنسيق على جميع الصفحات'
                    : 'Apply Style to All Pages'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3D PAGEFLIP VIEW */}
      {subTab === 'flip' && (
        <div
          data-testid="studio-flipbook-view"
          className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-5 print:hidden"
        >
          <div
            ref={flipWrapperRef}
            dir="ltr"
            className="max-w-3xl mx-auto min-h-[340px]"
          />
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!flipInstanceRef.current) return;
                if (project.rtl) flipInstanceRef.current.flipNext();
                else flipInstanceRef.current.flipPrev();
              }}
              className="px-5 py-2.5 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-bold text-[#443B3B] hover:bg-[#F8E8DC] cursor-pointer"
            >
              ‹ {isAr ? 'الصفحة السابقة' : 'Previous'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!flipInstanceRef.current) return;
                if (project.rtl) flipInstanceRef.current.flipPrev();
                else flipInstanceRef.current.flipNext();
              }}
              className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold hover:bg-[#332B2B] cursor-pointer"
            >
              {isAr ? 'الصفحة التالية' : 'Next'} ›
            </button>
          </div>
        </div>
      )}

      {/* PRINT & IMPOSITION VIEW */}
      {subTab === 'print' && (
        <div data-testid="studio-print-view" className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-4 print:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#443B3B]">
                  {isAr ? 'وضع الطباعة' : 'Print Layout'}
                </label>
                <select
                  value={printLayout}
                  onChange={(e) => setPrintLayout(e.target.value as PrintLayoutType)}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs font-semibold text-[#443B3B]"
                >
                  <option value="booklet">
                    {isAr
                      ? 'ملزمة مطوية (وجهان للطي والتدبيس)'
                      : 'Saddle-Stitch Booklet Imposition'}
                  </option>
                  <option value="single">
                    {isAr
                      ? 'صفحة بصفحة (تصدير PDF للعميل)'
                      : 'Single Page Proofs (PDF)'}
                  </option>
                </select>
              </div>

              {printLayout === 'booklet' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#443B3B]">
                      {isAr ? 'مقاس ورق الطباعة' : 'Paper Size'}
                    </label>
                    <select
                      value={paperSizeId}
                      onChange={(e) => setPaperSizeId(e.target.value)}
                      className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs font-semibold text-[#443B3B]"
                    >
                      {PRINT_PAPER_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {isAr ? opt.labelAr : opt.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#443B3B]">
                      {isAr ? 'الأوجه المطبوعة' : 'Sides'}
                    </label>
                    <select
                      value={printMode}
                      onChange={(e) => setPrintMode(e.target.value as PrintSidesMode)}
                      className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs font-semibold text-[#443B3B]"
                    >
                      <option value="all">{isAr ? 'كل الأوجه (وجهان تلقائي)' : 'All Sides (Duplex)'}</option>
                      <option value="f">{isAr ? 'الأوجه الأمامية فقط' : 'Front Sides Only'}</option>
                      <option value="b">{isAr ? 'الأوجه الخلفية فقط' : 'Back Sides Only'}</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {!printFitsPaper && (
              <p className="text-xs font-bold text-[#993636]">
                {isAr
                  ? '⚠ مقاس الصفحتين يتجاوز مقاس الورقة المختارة. اختر ورق A3 أفقي أو صغّر حجم الكتاب.'
                  : '⚠ Pages exceed selected paper dimensions. Choose larger paper or smaller book size.'}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#443B3B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFoldGuides}
                  onChange={(e) => setShowFoldGuides(e.target.checked)}
                  className="accent-[#443B3B]"
                />
                <span>{isAr ? 'إظهار حدود القص وعلامة الطيّ بالمنتصف' : 'Show cut/fold guides'}</span>
              </label>

              <button
                type="button"
                onClick={() => window.print()}
                data-testid="studio-print-trigger-btn"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold hover:bg-[#332B2B] cursor-pointer"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'طباعة / حفظ كملف PDF' : 'Print / Save PDF'}</span>
              </button>
            </div>

            <p className="text-xs text-[#706464] leading-relaxed">
              {isAr
                ? '• في الطابعة التلقائية: اختر الطباعة على الوجهين (قلب على الحافة القصيرة)، مقياس 100%، وبلا هوامش. بعد الطباعة ضع الأوراق فوق بعضها واطوها من المنتصف.'
                : '• Print duplex (flip on short edge), 100% scale, borderless. Stack sheets in order and fold in the center.'}
            </p>
          </div>

          {/* Printable Sheets Container */}
          {printLayout === 'booklet' ? (
            <div className="space-y-3">
              {impositionSheets.map((sheet) => {
                const sides: Array<{ key: 'f' | 'b'; pair: [number, number]; label: string }> = [
                  {
                    key: 'f',
                    pair: sheet.front,
                    label: isAr ? 'الوجه الأمامي' : 'Front Side',
                  },
                  {
                    key: 'b',
                    pair: sheet.back,
                    label: isAr ? 'الوجه الخلفي' : 'Back Side',
                  },
                ];
                return sides
                  .filter((s) => printMode === 'all' || printMode === s.key)
                  .map((side) => (
                    <div key={`${sheet.sheetNumber}-${side.key}`}>
                      <p className="text-xs font-semibold text-[#706464] mb-1 print:hidden">
                        {isAr
                          ? `ورقة ${sheet.sheetNumber} — ${side.label}`
                          : `Sheet ${sheet.sheetNumber} — ${side.label}`}
                      </p>
                      <div
                        dir="ltr"
                        style={{ aspectRatio: `${paperW} / ${paperH}` }}
                        className="mls-print-sheet relative w-full bg-white border border-[#EADFD7] flex items-center justify-center overflow-hidden"
                      >
                        {showFoldGuides && (
                          <div
                            aria-hidden="true"
                            className="absolute inset-y-0 left-1/2 border-l border-dashed border-[#443B3B]/30 print:hidden"
                          />
                        )}
                        {side.pair.map((pageIndex, slotIdx) => (
                          <div
                            key={`${side.key}-${slotIdx}`}
                            style={{
                              width: `${(project.w / paperW) * 100}%`,
                              height: `${(project.h / paperH) * 100}%`,
                            }}
                            className={
                              showFoldGuides
                                ? 'outline-1 outline-dashed outline-[#BBB]'
                                : ''
                            }
                          >
                            <BookStudioPageCanvas
                              page={paddedPages[pageIndex] || null}
                              rtl={project.rtl}
                              childPhotoAsset={project.childPhotoAsset}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:block">
              {project.pages.map((pg, idx) => (
                <div key={pg.id} className="space-y-1 print:space-y-0">
                  <p className="text-xs font-semibold text-[#706464] print:hidden">
                    {pageLabel(idx)}
                  </p>
                  <div
                    style={{ aspectRatio: `${project.w} / ${project.h}` }}
                    className="mls-print-single w-full bg-white border border-[#EADFD7] overflow-hidden"
                  >
                    <BookStudioPageCanvas
                      page={pg}
                      rtl={project.rtl}
                      childPhotoAsset={project.childPhotoAsset}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book Setup / New Modal */}
      {setupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#443B3B]/45 backdrop-blur-xs flex items-center justify-center p-4 print:hidden"
        >
          <div className="bg-white rounded-3xl border border-[#EADFD7] max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#443B3B]">
              {isAr ? 'إعدادات الكتاب / مشروع جديد' : 'Book Setup / New Project'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#443B3B]">
                  {isAr ? 'عنوان القصة' : 'Book Title'}
                </label>
                <input
                  type="text"
                  value={setupTitle}
                  onChange={(e) => setSetupTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#443B3B]">
                  {isAr ? 'اسم الطفل / المؤلف' : 'Child / Author'}
                </label>
                <input
                  type="text"
                  value={setupAuthor}
                  onChange={(e) => setSetupAuthor(e.target.value)}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#443B3B]">
                    {isAr ? 'صفحات المحتوى' : 'Content Pages'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={setupPagesCount}
                    onChange={(e) => setSetupPagesCount(Number(e.target.value) || 8)}
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-[#443B3B]">
                    {isAr ? 'مقاس جاهز' : 'Preset'}
                  </label>
                  <select
                    value={
                      BOOK_SIZE_PRESETS.some((p) => p.id === `${setupWidth},${setupHeight}`)
                        ? `${setupWidth},${setupHeight}`
                        : ''
                    }
                    onChange={(e) => {
                      const [w, h] = e.target.value.split(',').map(Number);
                      if (w && h) {
                        setSetupWidth(w);
                        setSetupHeight(h);
                      }
                    }}
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-2.5 py-2 text-xs"
                  >
                    <option value="">{isAr ? 'اختر مقاساً...' : 'Choose size...'}</option>
                    {BOOK_SIZE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.labelAr : p.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-semibold text-[#443B3B]">
                    {isAr ? 'العرض (مم)' : 'Width (mm)'}
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={400}
                    value={setupWidth}
                    onChange={(e) => setSetupWidth(Number(e.target.value) || 148)}
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-semibold text-[#443B3B]">
                    {isAr ? 'الارتفاع (مم)' : 'Height (mm)'}
                  </label>
                  <input
                    type="number"
                    min={80}
                    max={400}
                    value={setupHeight}
                    onChange={(e) => setSetupHeight(Number(e.target.value) || 210)}
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-semibold text-[#443B3B] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={setupRtl}
                  onChange={(e) => setSetupRtl(e.target.checked)}
                  className="accent-[#443B3B]"
                />
                <span>
                  {isAr
                    ? 'كتاب عربي (الكعب يمين، تقليب من اليمين إلى اليسار)'
                    : 'Arabic RTL book'}
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#EADFD7]">
              <button
                type="button"
                onClick={() => setSetupOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EADFD7] bg-white text-xs font-bold text-[#443B3B] cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => applySetupChanges(false)}
                className="px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] cursor-pointer"
              >
                {isAr ? 'تحديث الكتاب الحالي' : 'Apply to Current'}
              </button>
              <button
                type="button"
                onClick={() => applySetupChanges(true)}
                className="px-4 py-2 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold hover:bg-[#332B2B] cursor-pointer"
              >
                {isAr ? 'بدء كتاب جديد' : 'Start Fresh Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
