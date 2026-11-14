import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Info, PenLine } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useStories } from '../hooks/useStories';
import { useStorefrontSettings } from '../hooks/useStorefrontSettings';
import { useStoryDomains } from '../hooks/useStoryDomains';
import { CUSTOM_FREEFORM_STORY_ID } from '../services/orders/ordersService';
import { DEFAULT_HERO_IMAGE } from '../types/storefront';
import type { Story, StoryLanguageCode } from '../types/story';
import { DEFAULT_CUSTOM_BOOK_PRICE } from '../utils/adminSecurity';
import { getLocalizedStoryTitle } from '../utils/catalogFilter';
import { formatTND } from '../utils/pricing';
import {
  getDomainById,
  getDomainLabel,
  getDomainSubtopics,
  type StoryDomainId,
} from '../utils/storyDomains';
import { childInfoSchema, type ChildInfoFormValues } from '../utils/validation';
import { PhotoUploaderCropper } from '../components/customization/PhotoUploaderCropper';
import { ResilientImage } from '../components/common/ResilientImage';

type SelectionMode = 'domain' | 'freeform' | 'catalog';

export function CustomizePage() {
  const { storyId: paramStoryId } = useParams<{ storyId?: string }>();
  const [searchParams] = useSearchParams();
  const editCustomizationId = searchParams.get('edit');
  const queryDomainId = searchParams.get('domain');
  const queryMode = searchParams.get('mode');

  const { lang, t } = useLanguage();
  const { addToCart, updateCartItem, getItemByCustomizationId } = useCart();
  const { stories, loading, error, reload } = useStories();
  const { settings } = useStorefrontSettings();
  const { domains, loading: domainsLoading } = useStoryDomains(false);
  const navigate = useNavigate();

  const customBookPrice =
    typeof settings?.customBookPrice === 'number' && settings.customBookPrice > 0
      ? settings.customBookPrice
      : DEFAULT_CUSTOM_BOOK_PRICE;

  const editingItem = editCustomizationId
    ? getItemByCustomizationId(editCustomizationId)
    : undefined;

  const initialDomain = getDomainById(queryDomainId, domains);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(() => {
    if (queryMode === 'freeform' || queryDomainId === 'custom') return 'freeform';
    if (editingItem) {
      if (editingItem.storyId === CUSTOM_FREEFORM_STORY_ID || editingItem.storyIdea) {
        return editingItem.storyDomain &&
          domains.some(
            (d) =>
              d.label.ar === editingItem.storyDomain ||
              d.label.fr === editingItem.storyDomain ||
              d.label.en === editingItem.storyDomain
          )
          ? 'domain'
          : 'freeform';
      }
      if (!editingItem.storyDomain) return 'catalog';
      return 'domain';
    }
    if (paramStoryId === CUSTOM_FREEFORM_STORY_ID) return 'freeform';
    if (paramStoryId && !queryDomainId) return 'catalog';
    if (queryDomainId) return 'domain';
    return 'freeform';
  });

  const [selectedDomainId, setSelectedDomainId] = useState<StoryDomainId>(() => {
    if (initialDomain) return initialDomain.id;
    if (editingItem?.storyDomain) {
      const matched = domains.find(
        (d) =>
          d.label.ar === editingItem.storyDomain ||
          d.label.fr === editingItem.storyDomain ||
          d.label.en === editingItem.storyDomain
      );
      if (matched) return matched.id;
    }
    return domains[0]?.id || '';
  });

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    paramStoryId || editingItem?.storyId || initialDomain?.recommendedStoryId || CUSTOM_FREEFORM_STORY_ID
  );
  // Keep compressed photo Base64 strictly in React memory state (never in localStorage or URL)
  const [childPhotoBase64, setChildPhotoBase64] = useState<string>(
    editingItem?.childPhotoBase64 || ''
  );
  const [photoError, setPhotoError] = useState<string | undefined>(undefined);
  const [freeformError, setFreeformError] = useState<string | undefined>(undefined);

  const selectedDomain = getDomainById(selectedDomainId, domains) || domains[0];

  const {
    register,
    watch,
    trigger,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ChildInfoFormValues>({
    resolver: zodResolver(childInfoSchema),
    defaultValues: {
      childName: editingItem?.childName || '',
      childAge: editingItem?.childAge ?? 4,
      language: editingItem?.language || lang,
      dedication: editingItem?.dedication || '',
      storyDomain:
        editingItem?.storyDomain ||
        (selectionMode === 'domain' && selectedDomain
          ? getDomainLabel(selectedDomain, lang)
          : ''),
      storyIdea: editingItem?.storyIdea || '',
    },
  });

  useEffect(() => {
    if (!domainsLoading && queryDomainId && domains.length > 0) {
      const matched = getDomainById(queryDomainId, domains);
      if (matched) {
        setSelectedDomainId(matched.id);
      }
    }
  }, [domainsLoading, queryDomainId, domains]);

  useEffect(() => {
    if (selectionMode === 'domain') {
      if (selectedDomain) {
        setValue('storyDomain', getDomainLabel(selectedDomain, lang));
        if (stories.some((s) => s.id === selectedDomain.recommendedStoryId)) {
          setSelectedStoryId(selectedDomain.recommendedStoryId);
        } else {
          setSelectedStoryId(CUSTOM_FREEFORM_STORY_ID);
        }
      } else if (!domainsLoading && domains.length === 0) {
        setSelectionMode('freeform');
      }
    } else if (selectionMode === 'freeform') {
      setSelectedStoryId(CUSTOM_FREEFORM_STORY_ID);
    } else {
      setValue('storyDomain', '');
      if (paramStoryId) {
        setSelectedStoryId(paramStoryId);
      } else if ((!selectedStoryId || selectedStoryId === CUSTOM_FREEFORM_STORY_ID) && stories.length > 0) {
        setSelectedStoryId(stories[0].id);
      }
    }
  }, [
    selectionMode,
    selectedDomain,
    domains.length,
    domainsLoading,
    paramStoryId,
    stories,
    selectedStoryId,
    lang,
    setValue,
  ]);

  const freeformTemplateStory: Story = {
    id: CUSTOM_FREEFORM_STORY_ID,
    title: t.wizardModeFreeform,
    titleFr: t.wizardModeFreeform,
    titleEn: t.wizardModeFreeform,
    slug: CUSTOM_FREEFORM_STORY_ID,
    description: t.freeformPlotPlaceholder,
    category: t.wizardModeFreeform,
    coverImage: settings?.heroImage || DEFAULT_HERO_IMAGE,
    gallery: [],
    price: customBookPrice,
    pages: 28,
    format: '21 × 25 cm',
    paperType: 'Mat 170g',
    bindingType: 'Hardcover',
    ageRange: '2-12',
    language: ['ar', 'fr', 'en'],
    featured: false,
    active: true,
  };

  const activeStory =
    selectedStoryId === CUSTOM_FREEFORM_STORY_ID
      ? freeformTemplateStory
      : stories.find((s) => s.id === selectedStoryId) ||
        (selectionMode === 'catalog' ? stories[0] : freeformTemplateStory);
  const formValues = watch();

  const steps = [
    { num: 1, label: t.wizardStep1 },
    { num: 2, label: t.wizardStep2 },
    { num: 3, label: t.wizardStep3 },
    { num: 4, label: t.wizardStep4 },
    { num: 5, label: t.wizardStep5 },
  ] as const;

  const appendWritingHint = (snippet: string) => {
    const current = (getValues('storyIdea') || '').trim();
    const cleanSnippet = snippet.replace(/^\+\s*/, '');
    const next = current ? `${current}\n• ${cleanSnippet}: ` : `• ${cleanSnippet}: `;
    setValue('storyIdea', next.slice(0, 1200));
    setFreeformError(undefined);
  };

  const handleNext = async () => {
    if (step === 1) {
      const ok = await trigger([
        'childName',
        'childAge',
        'language',
        'dedication',
        'storyDomain',
        'storyIdea',
      ]);
      if (!ok) return;

      if (selectionMode === 'freeform') {
        const domainVal = (getValues('storyDomain') || '').trim();
        const ideaVal = (getValues('storyIdea') || '').trim();
        if (domainVal.length < 3 && ideaVal.length < 4) {
          setFreeformError(t.freeformIdeaRequiredError);
          return;
        }
      }
      setFreeformError(undefined);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!childPhotoBase64) {
        setPhotoError(t.photoRequiredError);
        return;
      }
      setPhotoError(undefined);
      setStep(3);
      return;
    }

    if (step === 3) {
      const ok = await trigger(['childName', 'childAge', 'language', 'dedication', 'storyIdea']);
      if (!ok || !activeStory) return;
      setStep(4);
      return;
    }

    if (step === 4) {
      setStep(5);
    }
  };

  const handleConfirmAddToCart = async () => {
    const ok = await trigger(['childName', 'childAge', 'language', 'dedication']);
    if (!ok) {
      setStep(1);
      return;
    }
    if (!childPhotoBase64) {
      setPhotoError(t.photoRequiredError);
      setStep(2);
      return;
    }
    if (!activeStory) return;

    const values = getValues();
    const resolvedDomain =
      selectionMode === 'domain'
        ? values.storyDomain.trim()
        : selectionMode === 'freeform'
        ? values.storyDomain.trim() || t.wizardModeFreeform
        : '';
    const resolvedIdea = (values.storyIdea || '').trim();
    const resolvedCover =
      selectionMode === 'domain' && selectedDomain
        ? selectedDomain.coverPreview
        : activeStory.coverImage;

    if (editingItem) {
      updateCartItem(editingItem.customizationId, {
        ...editingItem,
        storyId: activeStory.id,
        storyTitle: activeStory.title,
        storyTitleFr: activeStory.titleFr,
        storyTitleEn: activeStory.titleEn,
        storyDomain: resolvedDomain || undefined,
        storyIdea: resolvedIdea || undefined,
        coverImage: resolvedCover,
        childName: values.childName.trim(),
        childAge: Number(values.childAge),
        language: values.language,
        dedication: (values.dedication || '').trim(),
        childPhotoBase64,
        unitPrice: activeStory.price,
      });
    } else {
      addToCart({
        storyId: activeStory.id,
        storyTitle: activeStory.title,
        storyTitleFr: activeStory.titleFr,
        storyTitleEn: activeStory.titleEn,
        storyDomain: resolvedDomain || undefined,
        storyIdea: resolvedIdea || undefined,
        coverImage: resolvedCover,
        childName: values.childName.trim(),
        childAge: Number(values.childAge),
        language: values.language,
        dedication: (values.dedication || '').trim(),
        childPhotoBase64,
        unitPrice: activeStory.price,
      });
    }

    navigate('/cart');
  };

  const mapFieldError = (msg?: string) => {
    if (msg === 'childNameMin' || msg === 'childNameMax') return t.validationChildNameMin;
    if (msg === 'childAgeRange') return t.validationChildAgeRange;
    return msg;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-64 bg-[#EADFD7] rounded" />
        <div className="h-96 rounded-3xl bg-white border border-[#EADFD7]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#443B3B]">{t.errorLoadTitle}</h1>
        <p className="text-sm text-[#706464]">{t.errorLoadDesc}</p>
        <button
          type="button"
          onClick={reload}
          className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold cursor-pointer"
        >
          {t.retryBtn}
        </button>
      </div>
    );
  }

  const storyDisplayTitle = getLocalizedStoryTitle(activeStory, lang);
  const selectedBookLangLabel =
    formValues.language === 'ar'
      ? t.langAr
      : formValues.language === 'fr'
      ? t.langFr
      : t.langEn;

  const previewCoverSrc =
    selectionMode === 'domain' && selectedDomain
      ? selectedDomain.coverPreview
      : activeStory.coverImage;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">{t.wizardTitle}</h1>
        <p className="text-sm sm:text-base text-[#706464]">{t.wizardSubtitle}</p>
      </div>

      {/* Stepper */}
      <nav aria-label="Customization steps" className="grid grid-cols-5 gap-2">
        {steps.map((s) => {
          const isCompleted = step > s.num;
          const isCurrent = step === s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              disabled={s.num > step}
              className={`p-2.5 rounded-xl border text-center ${
                isCurrent
                  ? 'bg-[#443B3B] text-[#FFF9F2] border-[#443B3B]'
                  : isCompleted
                  ? 'bg-[#F8E8DC] text-[#443B3B] border-[#EADFD7] cursor-pointer hover:bg-[#F5B8B8]/40'
                  : 'bg-white text-[#706464] border-[#EADFD7] opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1 text-xs font-bold tabular-nums">
                {isCompleted && <Check className="w-3 h-3" aria-hidden="true" />}
                {s.num}
              </span>
              <span className="hidden sm:block text-xs font-medium mt-0.5 truncate">
                {s.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Wizard Card */}
      <div className="bg-white rounded-3xl border border-[#EADFD7] p-6 sm:p-8 space-y-6">
        {/* STEP 1 — STORY TYPE / PARENT FREE-FORM IDEA / CATALOG + CHILD INFORMATION */}
        {step === 1 && (
          <div className="space-y-6" data-testid="wizard-step-1">
            {/* 3 Creation Modes (hide domains/catalog only when not needed, or show empty prompts) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-xl bg-[#F8E8DC] border border-[#EADFD7]">
              <button
                type="button"
                onClick={() => {
                  setSelectionMode('freeform');
                  setValue('storyDomain', '');
                  setFreeformError(undefined);
                }}
                aria-pressed={selectionMode === 'freeform'}
                data-testid="wizard-mode-freeform-btn"
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  selectionMode === 'freeform'
                    ? 'bg-[#443B3B] text-[#FFF9F2]'
                    : 'text-[#443B3B] hover:bg-white/60'
                }`}
              >
                {t.wizardModeFreeform}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode('domain');
                  setFreeformError(undefined);
                }}
                aria-pressed={selectionMode === 'domain'}
                data-testid="wizard-mode-domain-btn"
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  selectionMode === 'domain'
                    ? 'bg-[#443B3B] text-[#FFF9F2]'
                    : 'text-[#443B3B] hover:bg-white/60'
                }`}
              >
                {t.wizardModeDomain}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectionMode('catalog');
                  setFreeformError(undefined);
                }}
                aria-pressed={selectionMode === 'catalog'}
                data-testid="wizard-mode-catalog-btn"
                className={`py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  selectionMode === 'catalog'
                    ? 'bg-[#443B3B] text-[#FFF9F2]'
                    : 'text-[#443B3B] hover:bg-white/60'
                }`}
              >
                {t.wizardModeCatalog}
              </button>
            </div>

            {selectionMode === 'domain' && domains.length === 0 && (
              <div className="rounded-2xl bg-[#FFF9F2] border border-[#EADFD7] p-5 text-center space-y-3">
                <p className="text-sm text-[#706464]">{t.catalogNoStoriesDesc}</p>
                <button
                  type="button"
                  onClick={() => setSelectionMode('freeform')}
                  className="px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold cursor-pointer"
                >
                  {t.wizardModeFreeform}
                </button>
              </div>
            )}

            {selectionMode === 'domain' && selectedDomain && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-[#443B3B]">
                    {t.domainSelectLabel}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pe-1">
                    {domains.map((dom) => {
                      const active = selectedDomain.id === dom.id;
                      return (
                        <button
                          key={dom.id}
                          type="button"
                          onClick={() => {
                            if (dom.id === 'custom') {
                              setSelectionMode('freeform');
                              setValue('storyDomain', '');
                              return;
                            }
                            setSelectedDomainId(dom.id);
                            setValue('storyDomain', getDomainLabel(dom, lang));
                          }}
                          aria-pressed={active}
                          data-testid={`domain-option-${dom.id}`}
                          className={`p-3 rounded-xl border text-start transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#443B3B] text-[#FFF9F2] border-[#443B3B]'
                              : 'bg-[#FFF9F2] text-[#443B3B] border-[#EADFD7] hover:bg-[#F8E8DC]'
                          }`}
                        >
                          <span className="block text-xs sm:text-sm font-bold">
                            {getDomainLabel(dom, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Precise Sub-topic Suggestions */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#706464]">
                    {t.domainSubtopicsLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {getDomainSubtopics(selectedDomain, lang).map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setValue('storyIdea', topic)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                          formValues.storyIdea === topic
                            ? 'bg-[#F5B8B8] text-[#443B3B] border-[#443B3B] font-semibold'
                            : 'bg-[#FFF9F2] text-[#443B3B] border-[#EADFD7] hover:bg-[#F8E8DC]'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="wizard-storyIdea"
                    className="block text-sm font-semibold text-[#443B3B]"
                  >
                    {t.storyIdeaLabel}
                  </label>
                  <textarea
                    id="wizard-storyIdea"
                    rows={3}
                    maxLength={1200}
                    placeholder={t.storyIdeaPlaceholder}
                    {...register('storyIdea')}
                    className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
                  />
                </div>
              </div>
            )}

            {selectionMode === 'freeform' && (
              <div
                data-testid="wizard-freeform-panel"
                className="rounded-2xl bg-[#FFF9F2] border border-[#EADFD7] p-5 space-y-4"
              >
                <div className="flex items-center gap-2.5 text-[#443B3B]">
                  <PenLine className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h2 className="text-sm sm:text-base font-bold">{t.wizardModeFreeform}</h2>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="freeform-storyDomain"
                    className="block text-sm font-semibold text-[#443B3B]"
                  >
                    {t.freeformTitleLabel}
                  </label>
                  <input
                    id="freeform-storyDomain"
                    type="text"
                    maxLength={120}
                    placeholder={t.freeformTitlePlaceholder}
                    {...register('storyDomain', {
                      onChange: () => setFreeformError(undefined),
                    })}
                    className="w-full rounded-xl border border-[#EADFD7] bg-white px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
                  />
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-[#706464]">
                    {t.freeformQuickHintsLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      t.freeformHintFamily,
                      t.freeformHintHobby,
                      t.freeformHintValue,
                      t.freeformHintPet,
                    ].map((hint) => (
                      <button
                        key={hint}
                        type="button"
                        onClick={() => appendWritingHint(hint)}
                        className="px-3 py-1.5 rounded-xl border border-[#EADFD7] bg-white text-xs font-medium text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="freeform-storyIdea"
                      className="block text-sm font-semibold text-[#443B3B]"
                    >
                      {t.freeformPlotLabel}
                    </label>
                    <span className="text-xs text-[#706464] tabular-nums">
                      {(formValues.storyIdea || '').length}/1200
                    </span>
                  </div>
                  <textarea
                    id="freeform-storyIdea"
                    rows={5}
                    maxLength={1200}
                    placeholder={t.freeformPlotPlaceholder}
                    {...register('storyIdea', {
                      onChange: () => setFreeformError(undefined),
                    })}
                    className="w-full rounded-xl border border-[#EADFD7] bg-white px-3.5 py-2.5 text-sm text-[#443B3B] leading-relaxed focus:outline-2 focus:outline-[#443B3B]"
                  />
                </div>

                {freeformError && (
                  <p className="text-xs font-semibold text-[#993636]" role="alert">
                    {freeformError}
                  </p>
                )}
              </div>
            )}

            {selectionMode === 'catalog' && (
              <div className="space-y-1.5">
                {stories.length === 0 ? (
                  <div className="rounded-2xl bg-[#FFF9F2] border border-[#EADFD7] p-5 text-center space-y-2.5">
                    <p className="text-sm font-semibold text-[#443B3B]">{t.catalogNoStoriesTitle}</p>
                    <button
                      type="button"
                      onClick={() => setSelectionMode('freeform')}
                      className="px-4 py-2 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold cursor-pointer"
                    >
                      {t.wizardModeFreeform}
                    </button>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor="wizard-story-select"
                      className="block text-sm font-semibold text-[#443B3B]"
                    >
                      {t.selectStoryLabel}
                    </label>
                    <select
                      id="wizard-story-select"
                      value={selectedStoryId}
                      onChange={(e) => setSelectedStoryId(e.target.value)}
                      className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
                    >
                      {stories.map((st) => (
                        <option key={st.id} value={st.id}>
                          {getLocalizedStoryTitle(st, lang)} — {formatTND(st.price, lang)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="wizard-childName"
                  className="block text-sm font-semibold text-[#443B3B]"
                >
                  {t.childNameLabel}
                </label>
                <input
                  id="wizard-childName"
                  type="text"
                  placeholder={t.childNamePlaceholder}
                  {...register('childName')}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
                />
                {errors.childName && (
                  <p className="text-xs text-[#993636]">
                    {mapFieldError(errors.childName.message)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="wizard-childAge"
                  className="block text-sm font-semibold text-[#443B3B]"
                >
                  {t.childAgeLabel}
                </label>
                <input
                  id="wizard-childAge"
                  type="number"
                  min={0}
                  max={14}
                  {...register('childAge', { valueAsNumber: true })}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] tabular-nums focus:outline-2 focus:outline-[#443B3B]"
                />
                {errors.childAge && (
                  <p className="text-xs text-[#993636]">
                    {mapFieldError(errors.childAge.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-[#443B3B]">
                {t.storyLanguageLabel}
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {(['ar', 'fr', 'en'] as StoryLanguageCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setValue('language', code)}
                    aria-pressed={formValues.language === code}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                      formValues.language === code
                        ? 'bg-[#443B3B] text-[#FFF9F2] border-[#443B3B]'
                        : 'bg-[#FFF9F2] text-[#443B3B] border-[#EADFD7] hover:bg-[#F8E8DC]'
                    }`}
                  >
                    {code === 'ar' ? t.langAr : code === 'fr' ? t.langFr : t.langEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="wizard-dedication"
                className="block text-sm font-semibold text-[#443B3B]"
              >
                {t.dedicationLabel}
              </label>
              <textarea
                id="wizard-dedication"
                rows={3}
                placeholder={t.dedicationPlaceholder}
                {...register('dedication')}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
              />
            </div>
          </div>
        )}

        {/* STEP 2 — CHILD PHOTO */}
        {step === 2 && (
          <div data-testid="wizard-step-2">
            <PhotoUploaderCropper
              photoBase64={childPhotoBase64}
              onPhotoChange={(b64) => {
                setChildPhotoBase64(b64);
                if (b64) setPhotoError(undefined);
              }}
              errorMessage={photoError}
            />
          </div>
        )}

        {/* STEP 3 — PERSONALIZATION */}
        {step === 3 && (
          <div className="space-y-5" data-testid="wizard-step-3">
            <h2 className="text-lg font-bold text-[#443B3B]">{t.wizardStep3}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="step3-childName"
                  className="block text-sm font-semibold text-[#443B3B]"
                >
                  {t.childNameLabel}
                </label>
                <input
                  id="step3-childName"
                  type="text"
                  {...register('childName')}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="step3-story"
                  className="block text-sm font-semibold text-[#443B3B]"
                >
                  {t.selectStoryLabel}
                </label>
                <select
                  id="step3-story"
                  value={selectedStoryId}
                  onChange={(e) => setSelectedStoryId(e.target.value)}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
                >
                  <option value={CUSTOM_FREEFORM_STORY_ID}>{t.wizardModeFreeform}</option>
                  {stories.map((st) => (
                    <option key={st.id} value={st.id}>
                      {getLocalizedStoryTitle(st, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="step3-lang"
                className="block text-sm font-semibold text-[#443B3B]"
              >
                {t.storyLanguageLabel}
              </label>
              <select
                id="step3-lang"
                {...register('language')}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
              >
                <option value="ar">{t.langAr}</option>
                <option value="fr">{t.langFr}</option>
                <option value="en">{t.langEn}</option>
              </select>
            </div>

            {selectionMode !== 'catalog' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="step3-storyIdea"
                  className="block text-sm font-semibold text-[#443B3B]"
                >
                  {selectionMode === 'freeform' ? t.freeformPlotLabel : t.storyIdeaLabel}
                </label>
                <textarea
                  id="step3-storyIdea"
                  rows={3}
                  maxLength={1200}
                  {...register('storyIdea')}
                  className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="step3-dedication"
                className="block text-sm font-semibold text-[#443B3B]"
              >
                {t.dedicationLabel}
              </label>
              <textarea
                id="step3-dedication"
                rows={3}
                {...register('dedication')}
                className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B]"
              />
            </div>
          </div>
        )}

        {/* STEP 4 — PREVIEW */}
        {step === 4 && (
          <div className="space-y-5" data-testid="wizard-step-4">
            <h2 className="text-lg font-bold text-[#443B3B]">{t.previewCardTitle}</h2>

            <div className="rounded-2xl border border-[#EADFD7] bg-[#FFF9F2] p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 aspect-[3/4] rounded-2xl overflow-hidden border border-[#EADFD7] bg-[#F8E8DC]">
                <ResilientImage
                  src={previewCoverSrc}
                  alt={storyDisplayTitle}
                  fallbackTitle={storyDisplayTitle}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-4">
                  {childPhotoBase64 && (
                    <img
                      src={childPhotoBase64}
                      alt={formValues.childName}
                      className="w-16 h-16 rounded-2xl object-cover border border-[#EADFD7] shrink-0"
                    />
                  )}
                  <div>
                    <p className="text-xs font-medium text-[#706464]">
                      {selectionMode !== 'catalog' && formValues.storyDomain
                        ? `${formValues.storyDomain} · ${storyDisplayTitle}`
                        : selectionMode === 'freeform'
                        ? `${t.wizardModeFreeform} · ${storyDisplayTitle}`
                        : storyDisplayTitle}
                    </p>
                    <h3 className="text-xl font-bold text-[#443B3B]">
                      {formValues.childName}
                    </h3>
                    <p className="text-xs text-[#706464]">
                      {formValues.childAge} {t.yearsUnit} · {selectedBookLangLabel}
                    </p>
                  </div>
                </div>

                {selectionMode !== 'catalog' && formValues.storyIdea && (
                  <p className="rounded-xl bg-white border border-[#EADFD7] p-3 text-xs sm:text-sm text-[#443B3B] whitespace-pre-line">
                    {formValues.storyIdea}
                  </p>
                )}

                {formValues.dedication && (
                  <blockquote className="rounded-xl bg-white border border-[#EADFD7] p-3.5 text-sm text-[#443B3B] italic">
                    “{formValues.dedication}”
                  </blockquote>
                )}

                <div className="pt-2 border-t border-[#EADFD7] flex items-center justify-between">
                  <span className="text-sm text-[#706464]">{t.productPriceLabel}</span>
                  <span className="text-xl font-bold text-[#443B3B] tabular-nums">
                    {formatTND(activeStory.price, lang)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#DCD6F7]/40 border border-[#DCD6F7] p-4 flex items-start gap-3 text-xs sm:text-sm text-[#443B3B]">
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">{t.previewNotice}</p>
            </div>
          </div>
        )}

        {/* STEP 5 — CONFIRM */}
        {step === 5 && (
          <div className="space-y-6" data-testid="wizard-step-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#B8CDBA]/50 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-[#3A6342]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#443B3B]">{t.wizardStep5}</h2>
                <p className="text-sm text-[#706464]">{storyDisplayTitle}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FFF9F2] border border-[#EADFD7] p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {childPhotoBase64 && (
                  <img
                    src={childPhotoBase64}
                    alt={formValues.childName}
                    className="w-14 h-14 rounded-xl object-cover border border-[#EADFD7]"
                  />
                )}
                <div>
                  <p className="font-bold text-[#443B3B]">{formValues.childName}</p>
                  <p className="text-xs text-[#706464]">
                    {formValues.childAge} {t.yearsUnit} · {selectedBookLangLabel}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-[#443B3B] tabular-nums">
                {formatTND(activeStory.price, lang)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmAddToCart}
              data-testid="confirm-add-to-cart-btn"
              className="w-full py-4 px-6 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] transition-colors cursor-pointer"
            >
              {editingItem ? t.saveChangesBtn : t.addToCartBtn}
            </button>
          </div>
        )}

        {/* Step Navigation Buttons */}
        <div className="pt-4 border-t border-[#EADFD7] flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() =>
                setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4 | 5) : prev))
              }
              className="px-5 py-2.5 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-sm font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
            >
              {t.prevStepBtn}
            </button>
          ) : (
            <span />
          )}

          {step < 5 && (
            <button
              type="button"
              onClick={handleNext}
              data-testid="wizard-next-btn"
              className="px-6 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold hover:bg-[#EE9E9E] transition-colors cursor-pointer"
            >
              {t.nextStepBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
