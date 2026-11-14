import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ImageService } from '../../services/images/ImageService';
import { saveStorefrontSettingsByAdmin } from '../../services/storefront/storefrontService';
import {
  DEFAULT_HERO_IMAGE,
  type StorefrontSettings,
} from '../../types/storefront';
import { STUDIO_ASSET_PRESETS } from '../../utils/storyAssets';
import { adminStorefrontSchema } from '../../utils/validation';
import { ResilientImage } from '../common/ResilientImage';

interface StorefrontEditorPanelProps {
  initialSettings: StorefrontSettings | null;
  onSaved: () => Promise<void>;
}

export function StorefrontEditorPanel({
  initialSettings,
  onSaved,
}: StorefrontEditorPanelProps) {
  const { lang, t } = useLanguage();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    heroHighlightAr: initialSettings?.heroHighlightAr || t.heroHighlight,
    heroHighlightFr: initialSettings?.heroHighlightFr || '',
    heroHighlightEn: initialSettings?.heroHighlightEn || '',
    heroTitleAr: initialSettings?.heroTitleAr || t.heroTitle,
    heroTitleFr: initialSettings?.heroTitleFr || '',
    heroTitleEn: initialSettings?.heroTitleEn || '',
    heroSubtitleAr: initialSettings?.heroSubtitleAr || t.heroSubtitle,
    heroSubtitleFr: initialSettings?.heroSubtitleFr || '',
    heroSubtitleEn: initialSettings?.heroSubtitleEn || '',
    heroCtaPrimaryAr: initialSettings?.heroCtaPrimaryAr || t.heroPrimaryCta,
    heroCtaPrimaryFr: initialSettings?.heroCtaPrimaryFr || '',
    heroCtaPrimaryEn: initialSettings?.heroCtaPrimaryEn || '',
    heroCtaSecondaryAr: initialSettings?.heroCtaSecondaryAr || t.heroSecondaryCta,
    heroCtaSecondaryFr: initialSettings?.heroCtaSecondaryFr || '',
    heroCtaSecondaryEn: initialSettings?.heroCtaSecondaryEn || '',
    heroImage: initialSettings?.heroImage || DEFAULT_HERO_IMAGE,
    featuredTitleAr: initialSettings?.featuredTitleAr || t.featuredTitle,
    featuredTitleFr: initialSettings?.featuredTitleFr || '',
    featuredTitleEn: initialSettings?.featuredTitleEn || '',
    featuredSubtitleAr: initialSettings?.featuredSubtitleAr || t.featuredSubtitle,
    featuredSubtitleFr: initialSettings?.featuredSubtitleFr || '',
    featuredSubtitleEn: initialSettings?.featuredSubtitleEn || '',
    domainsTitleAr: initialSettings?.domainsTitleAr || t.domainsSectionTitle,
    domainsTitleFr: initialSettings?.domainsTitleFr || '',
    domainsTitleEn: initialSettings?.domainsTitleEn || '',
    domainsSubtitleAr: initialSettings?.domainsSubtitleAr || t.domainsSectionSubtitle,
    domainsSubtitleFr: initialSettings?.domainsSubtitleFr || '',
    domainsSubtitleEn: initialSettings?.domainsSubtitleEn || '',
    customBookPrice: initialSettings?.customBookPrice ?? 69,
    contactLocation: initialSettings?.contactLocation || t.footerLocation,
    contactPhone: initialSettings?.contactPhone || '',
    contactEmail: initialSettings?.contactEmail || t.footerEmail,
    instagramUrl: initialSettings?.instagramUrl || '',
    facebookUrl: initialSettings?.facebookUrl || '',
  });

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!initialSettings) return;
    setForm((prev) => ({
      ...prev,
      heroHighlightAr: initialSettings.heroHighlightAr || prev.heroHighlightAr,
      heroHighlightFr: initialSettings.heroHighlightFr || '',
      heroHighlightEn: initialSettings.heroHighlightEn || '',
      heroTitleAr: initialSettings.heroTitleAr || prev.heroTitleAr,
      heroTitleFr: initialSettings.heroTitleFr || '',
      heroTitleEn: initialSettings.heroTitleEn || '',
      heroSubtitleAr: initialSettings.heroSubtitleAr || prev.heroSubtitleAr,
      heroSubtitleFr: initialSettings.heroSubtitleFr || '',
      heroSubtitleEn: initialSettings.heroSubtitleEn || '',
      heroCtaPrimaryAr: initialSettings.heroCtaPrimaryAr || prev.heroCtaPrimaryAr,
      heroCtaPrimaryFr: initialSettings.heroCtaPrimaryFr || '',
      heroCtaPrimaryEn: initialSettings.heroCtaPrimaryEn || '',
      heroCtaSecondaryAr:
        initialSettings.heroCtaSecondaryAr || prev.heroCtaSecondaryAr,
      heroCtaSecondaryFr: initialSettings.heroCtaSecondaryFr || '',
      heroCtaSecondaryEn: initialSettings.heroCtaSecondaryEn || '',
      heroImage: initialSettings.heroImage || DEFAULT_HERO_IMAGE,
      featuredTitleAr: initialSettings.featuredTitleAr || prev.featuredTitleAr,
      featuredTitleFr: initialSettings.featuredTitleFr || '',
      featuredTitleEn: initialSettings.featuredTitleEn || '',
      featuredSubtitleAr:
        initialSettings.featuredSubtitleAr || prev.featuredSubtitleAr,
      featuredSubtitleFr: initialSettings.featuredSubtitleFr || '',
      featuredSubtitleEn: initialSettings.featuredSubtitleEn || '',
      domainsTitleAr: initialSettings.domainsTitleAr || prev.domainsTitleAr,
      domainsTitleFr: initialSettings.domainsTitleFr || '',
      domainsTitleEn: initialSettings.domainsTitleEn || '',
      domainsSubtitleAr:
        initialSettings.domainsSubtitleAr || prev.domainsSubtitleAr,
      domainsSubtitleFr: initialSettings.domainsSubtitleFr || '',
      domainsSubtitleEn: initialSettings.domainsSubtitleEn || '',
      customBookPrice: initialSettings.customBookPrice ?? 69,
      contactLocation: initialSettings.contactLocation || prev.contactLocation,
      contactPhone: initialSettings.contactPhone || '',
      contactEmail: initialSettings.contactEmail || prev.contactEmail,
      instagramUrl: initialSettings.instagramUrl || '',
      facebookUrl: initialSettings.facebookUrl || '',
    }));
  }, [initialSettings]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(null);
    try {
      const compressed = await ImageService.compressArtworkImage(file, 960);
      setForm((prev) => ({ ...prev, heroImage: compressed.base64 }));
    } catch {
      setStatusMsg({ type: 'err', text: t.photoErrorProcess });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const parsed = adminStorefrontSchema.safeParse(form);
    if (!parsed.success) {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
      return;
    }

    setSaving(true);
    try {
      await saveStorefrontSettingsByAdmin(parsed.data);
      await onSaved();
      setStatusMsg({ type: 'ok', text: t.adminSaveSuccess });
    } catch {
      setStatusMsg({ type: 'err', text: t.adminSaveError });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSave}
      data-testid="admin-storefront-form"
      className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-3">
          <p className="text-sm font-bold text-[#443B3B]">
            {lang === 'ar'
              ? 'صورة البانر الرئيسية بالواجهة'
              : lang === 'fr'
              ? 'Image principale de la vitrine'
              : 'Homepage Hero Banner Image'}
          </p>
          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7]">
            <ResilientImage
              src={form.heroImage}
              alt="Hero preview"
              fallbackTitle="Hero"
              className="w-full h-full object-cover"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.adminUploadImageBtn}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="storefront-hero-preset"
              className="block text-xs font-semibold text-[#706464]"
            >
              {lang === 'ar'
                ? 'أو اختر من مكتبة صور المتجر'
                : lang === 'fr'
                ? 'Ou choisir un visuel intégré'
                : 'Or choose a studio visual'}
            </label>
            <select
              id="storefront-hero-preset"
              value={STUDIO_ASSET_PRESETS.some((p) => p.path === form.heroImage) ? form.heroImage : ''}
              onChange={(e) => {
                if (e.target.value) setForm((prev) => ({ ...prev, heroImage: e.target.value }));
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

          <div className="space-y-1.5">
            <label
              htmlFor="storefront-hero-url"
              className="block text-xs font-semibold text-[#706464]"
            >
              {lang === 'ar' ? 'مسار أو رابط الصورة' : 'Image Path / URL'}
            </label>
            <input
              id="storefront-hero-url"
              type="text"
              dir="ltr"
              value={form.heroImage.startsWith('data:') ? 'data:image/jpeg;base64,...' : form.heroImage}
              onChange={(e) => setForm((prev) => ({ ...prev, heroImage: e.target.value }))}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="sf-hero-highlight-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'الشريط الترويجي العلوي (عربي)' : 'Hero Highlight (AR)'}
              </label>
              <input
                id="sf-hero-highlight-ar"
                type="text"
                value={form.heroHighlightAr}
                onChange={(e) => setForm((p) => ({ ...p, heroHighlightAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="sf-hero-title-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'العنوان الرئيسي للواجهة (عربي)' : 'Hero Headline (AR)'}
              </label>
              <input
                id="sf-hero-title-ar"
                type="text"
                required
                value={form.heroTitleAr}
                onChange={(e) => setForm((p) => ({ ...p, heroTitleAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-hero-title-fr" className="block text-xs font-semibold text-[#706464]">
                Hero Headline (FR)
              </label>
              <input
                id="sf-hero-title-fr"
                type="text"
                value={form.heroTitleFr}
                onChange={(e) => setForm((p) => ({ ...p, heroTitleFr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-hero-title-en" className="block text-xs font-semibold text-[#706464]">
                Hero Headline (EN)
              </label>
              <input
                id="sf-hero-title-en"
                type="text"
                value={form.heroTitleEn}
                onChange={(e) => setForm((p) => ({ ...p, heroTitleEn: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-xs text-[#443B3B]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="sf-hero-sub-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'الوصف تحت العنوان الرئيسي (عربي)' : 'Hero Subtitle (AR)'}
              </label>
              <textarea
                id="sf-hero-sub-ar"
                rows={2}
                required
                value={form.heroSubtitleAr}
                onChange={(e) => setForm((p) => ({ ...p, heroSubtitleAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-cta1-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'نص الزر الأول (عربي)' : 'Primary CTA (AR)'}
              </label>
              <input
                id="sf-cta1-ar"
                type="text"
                value={form.heroCtaPrimaryAr}
                onChange={(e) => setForm((p) => ({ ...p, heroCtaPrimaryAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-cta2-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'نص الزر الثاني (عربي)' : 'Secondary CTA (AR)'}
              </label>
              <input
                id="sf-cta2-ar"
                type="text"
                value={form.heroCtaSecondaryAr}
                onChange={(e) => setForm((p) => ({ ...p, heroCtaSecondaryAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-feat-title-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'عنوان قسم القصص المميزة' : 'Featured Section Title (AR)'}
              </label>
              <input
                id="sf-feat-title-ar"
                type="text"
                value={form.featuredTitleAr}
                onChange={(e) => setForm((p) => ({ ...p, featuredTitleAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-dom-title-ar" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'عنوان قسم أنواع القصص' : 'Domains Section Title (AR)'}
              </label>
              <input
                id="sf-dom-title-ar"
                type="text"
                value={form.domainsTitleAr}
                onChange={(e) => setForm((p) => ({ ...p, domainsTitleAr: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-custom-price" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'سعر كتاب التأليف الحر (د.ت)' : 'Custom Story Price (TND)'}
              </label>
              <input
                id="sf-custom-price"
                type="number"
                min={1}
                max={1000}
                step="0.5"
                value={form.customBookPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customBookPrice: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B] tabular-nums"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-contact-phone" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'هاتف التواصل (اختياري)' : 'Contact Phone'}
              </label>
              <input
                id="sf-contact-phone"
                type="text"
                dir="ltr"
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-contact-email" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'بريد التواصل' : 'Contact Email'}
              </label>
              <input
                id="sf-contact-email"
                type="email"
                dir="ltr"
                value={form.contactEmail}
                onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sf-contact-loc" className="block text-xs font-semibold text-[#443B3B]">
                {lang === 'ar' ? 'الموقع / المدينة' : 'Location'}
              </label>
              <input
                id="sf-contact-loc"
                type="text"
                value={form.contactLocation}
                onChange={(e) => setForm((p) => ({ ...p, contactLocation: e.target.value }))}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3 py-2 text-sm text-[#443B3B]"
              />
            </div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold ${
            statusMsg.type === 'ok'
              ? 'bg-[#B8CDBA]/40 text-[#2E5436]'
              : 'bg-[#F5B8B8]/40 text-[#8F2828]'
          }`}
        >
          {statusMsg.text}
        </p>
      )}

      <div className="flex justify-end pt-2 border-t border-[#EADFD7]">
        <button
          type="submit"
          disabled={saving}
          data-testid="admin-save-storefront-btn"
          className="px-6 py-3 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] disabled:opacity-60 transition-colors cursor-pointer"
        >
          {saving ? '...' : t.adminSaveBtn}
        </button>
      </div>
    </form>
  );
}
