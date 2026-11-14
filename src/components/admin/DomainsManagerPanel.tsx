import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ImageService } from '../../services/images/ImageService';
import {
  deleteStoryDomainByAdmin,
  saveStoryDomainByAdmin,
} from '../../services/storefront/storefrontService';
import type { Story } from '../../types/story';
import { STUDIO_ASSET_PRESETS } from '../../utils/storyAssets';
import { getDomainLabel, type StoryDomain } from '../../utils/storyDomains';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ResilientImage } from '../common/ResilientImage';

interface DomainsManagerPanelProps {
  domains: StoryDomain[];
  stories: Story[];
  onRefresh: () => Promise<void>;
}

function makeEmptyDomain(): StoryDomain {
  const id = `domain-${Date.now().toString(36).slice(-5)}`;
  return {
    id,
    label: { ar: '', fr: '', en: '' },
    summary: { ar: '', fr: '', en: '' },
    subtopics: { ar: [], fr: [], en: [] },
    recommendedStoryId: 'custom-freeform',
    coverPreview: '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
    sortOrder: 50,
    active: true,
  };
}

export function DomainsManagerPanel({
  domains,
  stories,
  onRefresh,
}: DomainsManagerPanelProps) {
  const { lang, t } = useLanguage();
  const [editing, setEditing] = useState<StoryDomain>(() => makeEmptyDomain());
  const [subtopicsText, setSubtopicsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoryDomain | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  const selectDomain = (dom: StoryDomain) => {
    setEditing(dom);
    setSubtopicsText((dom.subtopics.ar || []).join('\n'));
    setStatusMsg(null);
  };

  const resetDomain = () => {
    const empty = makeEmptyDomain();
    setEditing(empty);
    setSubtopicsText('');
    setStatusMsg(null);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await ImageService.compressArtworkImage(file, 720);
      setEditing((prev) => ({ ...prev, coverPreview: compressed.base64 }));
    } catch {
      setStatusMsg({ type: 'err', text: t.photoErrorProcess });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (editing.label.ar.trim().length < 2 || editing.summary.ar.trim().length < 2) {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
      return;
    }

    const lines = subtopicsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    setSaving(true);
    try {
      await saveStoryDomainByAdmin({
        ...editing,
        subtopics: {
          ar: lines,
          fr: editing.subtopics.fr.length ? editing.subtopics.fr : lines,
          en: editing.subtopics.en.length ? editing.subtopics.en : lines,
        },
      });
      await onRefresh();
      setStatusMsg({ type: 'ok', text: t.adminSaveSuccess });
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStoryDomainByAdmin(deleteTarget.id);
      if (editing.id === deleteTarget.id) resetDomain();
      await onRefresh();
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EADFD7] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-[#443B3B]">
            {lang === 'ar'
              ? `أنواع القصص المتاحة (${domains.length})`
              : `Story Genres (${domains.length})`}
          </h2>
          <button
            type="button"
            onClick={resetDomain}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.adminAddDomainBtn}</span>
          </button>
        </div>

        {domains.length === 0 ? (
          <p className="text-xs text-[#706464] py-6 text-center">
            {lang === 'ar'
              ? 'لا توجد أنواع قصص مسجلة في فايرستور بعد.'
              : 'No story genres saved in Firestore yet.'}
          </p>
        ) : null}

        <div className="divide-y divide-[#EADFD7] max-h-[540px] overflow-y-auto pe-1">
          {domains.map((dom) => (
            <div key={dom.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-14 rounded-lg overflow-hidden bg-[#F8E8DC] border border-[#EADFD7] shrink-0">
                  <ResilientImage
                    src={dom.coverPreview}
                    alt={getDomainLabel(dom, lang)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#443B3B] truncate">
                    {getDomainLabel(dom, lang)}
                  </p>
                  <p className="text-xs text-[#706464] truncate">
                    {dom.active === false ? t.adminArchivedBadge : t.adminPublishedBadge}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => selectDomain(dom)}
                  aria-label={`${t.adminEditStoryBtn} ${getDomainLabel(dom, lang)}`}
                  className="p-2 rounded-lg border border-[#EADFD7] bg-[#FFF9F2] text-[#443B3B] hover:bg-[#F8E8DC] cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(dom)}
                  aria-label={`${t.adminDeleteStoryBtn} ${getDomainLabel(dom, lang)}`}
                  className="p-2 rounded-lg border border-[#EADFD7] bg-white text-[#993636] hover:bg-[#F5B8B8]/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="lg:col-span-6 bg-white rounded-2xl border border-[#EADFD7] p-5 sm:p-6 space-y-4"
      >
        <h2 className="text-base font-bold text-[#443B3B]">
          {lang === 'ar' ? 'تعديل أو إضافة نوع قصة' : 'Edit / Create Story Genre'}
        </h2>

        <div className="flex items-center gap-3">
          <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7] shrink-0">
            <ResilientImage
              src={editing.coverPreview}
              alt={editing.label.ar || 'Genre cover'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold cursor-pointer">
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
              aria-label="Preset domain cover"
              value={
                STUDIO_ASSET_PRESETS.some((p) => p.path === editing.coverPreview)
                  ? editing.coverPreview
                  : ''
              }
              onChange={(e) => {
                if (e.target.value) {
                  setEditing((p) => ({ ...p, coverPreview: e.target.value }));
                }
              }}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            >
              <option value="">--</option>
              {STUDIO_ASSET_PRESETS.map((asset) => (
                <option key={asset.path} value={asset.path}>
                  {lang === 'fr' ? asset.labelFr : lang === 'en' ? asset.labelEn : asset.labelAr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="dom-label-ar" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'اسم المجال (عربي)' : 'Genre Name (AR)'}
            </label>
            <input
              id="dom-label-ar"
              type="text"
              required
              value={editing.label.ar}
              onChange={(e) =>
                setEditing((p) => ({ ...p, label: { ...p.label, ar: e.target.value } }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="dom-label-fr" className="block text-xs font-semibold text-[#706464]">
              Name (FR)
            </label>
            <input
              id="dom-label-fr"
              type="text"
              value={editing.label.fr}
              onChange={(e) =>
                setEditing((p) => ({ ...p, label: { ...p.label, fr: e.target.value } }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="dom-label-en" className="block text-xs font-semibold text-[#706464]">
              Name (EN)
            </label>
            <input
              id="dom-label-en"
              type="text"
              value={editing.label.en}
              onChange={(e) =>
                setEditing((p) => ({ ...p, label: { ...p.label, en: e.target.value } }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="dom-summary-ar" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'نبذة مختصرة (عربي)' : 'Summary (AR)'}
            </label>
            <input
              id="dom-summary-ar"
              type="text"
              required
              value={editing.summary.ar}
              onChange={(e) =>
                setEditing((p) => ({
                  ...p,
                  summary: { ...p.summary, ar: e.target.value },
                }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="dom-subtopics" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar'
                ? 'أفكار فرعية مقترحة (سطر لكل فكرة)'
                : 'Suggested sub-ideas (one per line)'}
            </label>
            <textarea
              id="dom-subtopics"
              rows={3}
              value={subtopicsText}
              onChange={(e) => setSubtopicsText(e.target.value)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="dom-story-link" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'الكتاب المرجعي للتسعير' : 'Linked Story for Pricing'}
            </label>
            <select
              id="dom-story-link"
              value={editing.recommendedStoryId}
              onChange={(e) =>
                setEditing((p) => ({ ...p, recommendedStoryId: e.target.value }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            >
              <option value="custom-freeform">{t.wizardModeFreeform}</option>
              {stories.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.title} ({st.price} TND)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="dom-sort" className="block text-xs font-semibold text-[#443B3B]">
              {lang === 'ar' ? 'الترتيب' : 'Sort Order'}
            </label>
            <input
              id="dom-sort"
              type="number"
              min={0}
              max={500}
              value={editing.sortOrder ?? 100}
              onChange={(e) =>
                setEditing((p) => ({ ...p, sortOrder: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B] tabular-nums"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#443B3B] cursor-pointer">
          <input
            type="checkbox"
            checked={editing.active !== false}
            onChange={(e) => setEditing((p) => ({ ...p, active: e.target.checked }))}
            className="w-4 h-4 accent-[#443B3B]"
          />
          <span>{t.adminPublishedBadge}</span>
        </label>

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
        <p>{deleteTarget ? getDomainLabel(deleteTarget, lang) : ''}</p>
      </ConfirmDialog>
    </div>
  );
}
