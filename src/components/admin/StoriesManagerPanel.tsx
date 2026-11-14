import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ImageService } from '../../services/images/ImageService';
import {
  deleteStoriesBatchByAdmin,
  deleteStoryByAdmin,
  saveStoryByAdmin,
} from '../../services/stories/storiesService';
import type { Story } from '../../types/story';
import { formatTND } from '../../utils/pricing';
import { STUDIO_ASSET_PRESETS } from '../../utils/storyAssets';
import { adminStorySchema } from '../../utils/validation';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ResilientImage } from '../common/ResilientImage';

interface StoriesManagerPanelProps {
  stories: Story[];
  onRefresh: () => Promise<void>;
}

function makeEmptyStoryForm(): Story {
  const uniqueSuffix = Date.now().toString(36).slice(-5);
  return {
    id: `story-${uniqueSuffix}`,
    title: '',
    titleFr: '',
    titleEn: '',
    slug: `custom-story-${uniqueSuffix}`,
    description: '',
    descriptionFr: '',
    descriptionEn: '',
    category: 'مغامرات',
    categoryFr: 'Aventure',
    categoryEn: 'Adventure',
    coverImage: '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
    gallery: ['/src/assets/images/story_interior_spread_1794606420124.jpg'],
    price: 68,
    pages: 28,
    format: '21 × 25 cm',
    paperType: 'ورق فني مطفي 170 غرام / Papier mat 170g',
    bindingType: 'غلاف مقوى فاخر / Reliure rigide',
    ageRange: '3-8',
    prepTime: '3-4 أيام عمل / 3-4 jours',
    language: ['ar', 'fr', 'en'],
    featured: false,
    active: true,
  };
}

export function StoriesManagerPanel({ stories, onRefresh }: StoriesManagerPanelProps) {
  const { lang, t } = useLanguage();
  const [editingStory, setEditingStory] = useState<Story>(() => makeEmptyStoryForm());
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (isNew) return;
    const fresh = stories.find((s) => s.id === editingStory.id);
    if (fresh?.createdAt && fresh.createdAt !== editingStory.createdAt) {
      setEditingStory((prev) =>
        prev.id === fresh.id ? { ...prev, createdAt: fresh.createdAt } : prev
      );
    }
  }, [stories, isNew, editingStory.id, editingStory.createdAt]);

  const selectForEdit = (story: Story) => {
    setIsNew(false);
    setEditingStory({ ...story });
    setStatusMsg(null);
  };

  const resetToNew = () => {
    setIsNew(true);
    setEditingStory(makeEmptyStoryForm());
    setStatusMsg(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    try {
      const compressed = await ImageService.compressArtworkImage(file, 720);
      setEditingStory((prev) => ({
        ...prev,
        coverImage: compressed.base64,
        gallery: [compressed.base64, ...prev.gallery.filter((g) => g !== prev.coverImage)].slice(
          0,
          4
        ),
      }));
    } catch {
      setStatusMsg({ type: 'err', text: t.photoErrorProcess });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const parsed = adminStorySchema.safeParse({
      id: editingStory.id,
      title: editingStory.title,
      titleFr: editingStory.titleFr || '',
      titleEn: editingStory.titleEn || '',
      slug: editingStory.slug,
      description: editingStory.description,
      descriptionFr: editingStory.descriptionFr || '',
      descriptionEn: editingStory.descriptionEn || '',
      category: editingStory.category,
      categoryFr: editingStory.categoryFr || '',
      categoryEn: editingStory.categoryEn || '',
      coverImage: editingStory.coverImage,
      price: Number(editingStory.price),
      pages: Math.round(Number(editingStory.pages)),
      format: editingStory.format,
      paperType: editingStory.paperType,
      bindingType: editingStory.bindingType,
      ageRange: editingStory.ageRange,
      prepTime: editingStory.prepTime || '',
      featured: Boolean(editingStory.featured),
      active: Boolean(editingStory.active),
    });

    if (!parsed.success) {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
      return;
    }

    setSaving(true);
    try {
      await saveStoryByAdmin(editingStory, { isNew });
      await onRefresh();
      setStatusMsg({ type: 'ok', text: t.adminSaveSuccess });
      if (isNew) {
        setIsNew(false);
      }
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStoryByAdmin(deleteTarget.id);
      if (editingStory.id === deleteTarget.id) {
        resetToNew();
      }
      await onRefresh();
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleConfirmClearAll = async () => {
    try {
      await deleteStoriesBatchByAdmin(stories.map((s) => s.id));
      resetToNew();
      await onRefresh();
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setConfirmClearAll(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Existing Stories Catalog Table */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#443B3B]">
            {lang === 'ar'
              ? `القصص المتوفرة (${stories.length})`
              : `Stories (${stories.length})`}
          </h2>
          <div className="flex items-center gap-2">
            {stories.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-[#EADFD7] bg-white text-[#993636] text-xs font-bold hover:bg-[#F5B8B8]/25 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.adminDeleteAllBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={resetToNew}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.adminAddStoryBtn}</span>
            </button>
          </div>
        </div>

        {stories.length === 0 ? (
          <p className="text-xs text-[#706464] py-6 text-center">{t.catalogNoStoriesTitle}</p>
        ) : null}

        <div className="divide-y divide-[#EADFD7]">
          {stories.map((story) => (
            <div
              key={story.id}
              data-testid={`admin-story-row-${story.id}`}
              className="py-3.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-16 rounded-xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7] shrink-0">
                  <ResilientImage
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-[#443B3B] truncate">
                    {story.title}
                  </p>
                  <p className="text-xs text-[#706464] truncate">
                    {story.category} ·{' '}
                    <span className="tabular-nums font-semibold">
                      {formatTND(story.price, lang)}
                    </span>{' '}
                    · {story.active ? t.adminPublishedBadge : t.adminArchivedBadge}
                    {story.featured ? ` · ${t.adminFeaturedBadge}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => selectForEdit(story)}
                  aria-label={`${t.adminEditStoryBtn} ${story.title}`}
                  className="p-2 rounded-lg border border-[#EADFD7] bg-[#FFF9F2] text-[#443B3B] hover:bg-[#F8E8DC] cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(story)}
                  aria-label={`${t.adminDeleteStoryBtn} ${story.title}`}
                  className="p-2 rounded-lg border border-[#EADFD7] bg-white text-[#993636] hover:bg-[#F5B8B8]/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Story Editor Form */}
      <form
        onSubmit={handleSave}
        data-testid="admin-story-form"
        className="lg:col-span-6 bg-white rounded-2xl border border-[#EADFD7] p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#443B3B]">
            {isNew ? t.adminNewStoryTitle : t.adminEditStoryTitle}
          </h2>
          {!isNew && (
            <button
              type="button"
              onClick={resetToNew}
              className="text-xs font-semibold text-[#706464] underline underline-offset-4 cursor-pointer"
            >
              {t.adminResetFormBtn}
            </button>
          )}
        </div>

        {/* Cover Image Preview & Uploader */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-28 aspect-[3/4] rounded-xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7] shrink-0">
            <ResilientImage
              src={editingStory.coverImage}
              alt={editingStory.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 w-full space-y-2.5">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.adminUploadImageBtn}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
              />
            </label>

            <select
              aria-label="Preset cover image"
              value={
                STUDIO_ASSET_PRESETS.some((p) => p.path === editingStory.coverImage)
                  ? editingStory.coverImage
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditingStory((prev) => ({
                    ...prev,
                    coverImage: e.target.value,
                    gallery: [e.target.value, ...prev.gallery.slice(1)],
                  }));
                }
              }}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            >
              <option value="">
                {lang === 'ar' ? 'اختر صورة جاهزة أو الصق رابطاً...' : 'Choose preset cover...'}
              </option>
              {STUDIO_ASSET_PRESETS.map((asset) => (
                <option key={asset.path} value={asset.path}>
                  {lang === 'fr' ? asset.labelFr : lang === 'en' ? asset.labelEn : asset.labelAr}
                </option>
              ))}
            </select>

            <input
              type="text"
              dir="ltr"
              aria-label="Cover image URL"
              value={
                editingStory.coverImage.startsWith('data:')
                  ? 'data:image/jpeg;base64,...'
                  : editingStory.coverImage
              }
              onChange={(e) =>
                setEditingStory((prev) => ({ ...prev, coverImage: e.target.value }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>
        </div>

        {/* Titles & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="st-title-ar" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'عنوان القصة (عربي)' : 'Title (AR)'}
            </label>
            <input
              id="st-title-ar"
              type="text"
              required
              value={editingStory.title}
              onChange={(e) => setEditingStory((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-title-fr" className="block text-xs font-semibold text-[#706464]">
              Title (FR)
            </label>
            <input
              id="st-title-fr"
              type="text"
              value={editingStory.titleFr || ''}
              onChange={(e) => setEditingStory((p) => ({ ...p, titleFr: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-title-en" className="block text-xs font-semibold text-[#706464]">
              Title (EN)
            </label>
            <input
              id="st-title-en"
              type="text"
              value={editingStory.titleEn || ''}
              onChange={(e) => setEditingStory((p) => ({ ...p, titleEn: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-price" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'الثمن (د.ت)' : 'Price (TND)'}
            </label>
            <input
              id="st-price"
              type="number"
              min={1}
              max={1000}
              step="0.5"
              required
              value={editingStory.price}
              onChange={(e) =>
                setEditingStory((p) => ({ ...p, price: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B] tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-pages" className="block text-xs font-semibold text-[#443B3B]">
              {t.specPages}
            </label>
            <input
              id="st-pages"
              type="number"
              min={8}
              max={200}
              required
              value={editingStory.pages}
              onChange={(e) =>
                setEditingStory((p) => ({ ...p, pages: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B] tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-cat-ar" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'التصنيف (عربي)' : 'Category (AR)'}
            </label>
            <input
              id="st-cat-ar"
              type="text"
              required
              value={editingStory.category}
              onChange={(e) => setEditingStory((p) => ({ ...p, category: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="st-age" className="block text-xs font-semibold text-[#443B3B]">
              {t.specAge}
            </label>
            <input
              id="st-age"
              type="text"
              required
              value={editingStory.ageRange}
              onChange={(e) => setEditingStory((p) => ({ ...p, ageRange: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="st-desc-ar" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'وصف القصة (عربي - 10 أحرف على الأقل)' : 'Description (AR)'}
            </label>
            <textarea
              id="st-desc-ar"
              rows={3}
              required
              value={editingStory.description}
              onChange={(e) =>
                setEditingStory((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#443B3B] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(editingStory.active)}
              onChange={(e) =>
                setEditingStory((p) => ({ ...p, active: e.target.checked }))
              }
              className="w-4 h-4 accent-[#443B3B]"
            />
            <span>{t.adminPublishedBadge}</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#443B3B] cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(editingStory.featured)}
              onChange={(e) =>
                setEditingStory((p) => ({ ...p, featured: e.target.checked }))
              }
              className="w-4 h-4 accent-[#443B3B]"
            />
            <span>{t.adminFeaturedBadge}</span>
          </label>
        </div>

        {statusMsg && (
          <p
            role="status"
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
              statusMsg.type === 'ok'
                ? 'bg-[#B8CDBA]/40 text-[#2E5436]'
                : 'bg-[#F5B8B8]/40 text-[#8F2828]'
            }`}
          >
            {statusMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          data-testid="admin-save-story-btn"
          className="w-full py-3 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saving ? '...' : t.adminSaveBtn}
        </button>
      </form>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t.adminDeleteStoryBtn}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        confirmLabel={t.confirmBtn}
        cancelLabel={t.cancelBtn}
        destructive
      >
        <p>
          {deleteTarget
            ? `${deleteTarget.title} (${formatTND(deleteTarget.price, lang)})`
            : ''}
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmClearAll}
        title={t.adminDeleteAllBtn}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={handleConfirmClearAll}
        confirmLabel={t.confirmBtn}
        cancelLabel={t.cancelBtn}
        destructive
      >
        <p>
          {lang === 'ar'
            ? `هل تريد حذف جميع القصص (${stories.length}) من قاعدة البيانات؟`
            : `Delete all ${stories.length} stories from Firestore?`}
        </p>
      </ConfirmDialog>
    </div>
  );
}
