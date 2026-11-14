import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStoryDetails } from '../hooks/useStoryDetails';
import {
  getLocalizedStoryCategory,
  getLocalizedStoryDescription,
  getLocalizedStoryTitle,
} from '../utils/catalogFilter';
import { formatTND } from '../utils/pricing';
import { ResilientImage } from '../components/common/ResilientImage';

export function StoryDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, dir, t } = useLanguage();
  const { story, loading, error, reload } = useStoryDetails(id);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[3/4] rounded-3xl bg-[#F8E8DC]" />
          <div className="lg:col-span-6 space-y-4 py-4">
            <div className="h-5 w-32 bg-[#EADFD7] rounded" />
            <div className="h-9 w-3/4 bg-[#EADFD7] rounded" />
            <div className="h-24 w-full bg-[#F8E8DC] rounded-xl" />
            <div className="h-12 w-48 bg-[#F5B8B8]/60 rounded-xl" />
          </div>
        </div>
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

  if (!story) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#443B3B]">{t.storyNotFound}</h1>
        <p className="text-sm text-[#706464]">{t.storyNotFoundDesc}</p>
        <Link
          to="/stories"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold"
        >
          {t.backToStories}
        </Link>
      </div>
    );
  }

  const title = getLocalizedStoryTitle(story, lang);
  const description = getLocalizedStoryDescription(story, lang);
  const category = getLocalizedStoryCategory(story, lang);
  const galleryImages =
    story.gallery.length > 0 ? story.gallery : [story.coverImage];
  const currentImage = galleryImages[activeImageIndex] || story.coverImage;

  const languageLabels = story.language
    .map((code) => (code === 'ar' ? t.langAr : code === 'fr' ? t.langFr : t.langEn))
    .join(' · ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        to="/stories"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#706464] hover:text-[#443B3B] transition-colors"
      >
        <BackIcon className="w-4 h-4" aria-hidden="true" />
        <span>{t.backToStories}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Gallery Left */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-[3/4] sm:aspect-[4/4] rounded-3xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7]">
            <ResilientImage
              src={currentImage}
              alt={title}
              fallbackTitle={title}
              className="w-full h-full object-cover"
            />
          </div>

          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Preview ${idx + 1}`}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#443B3B]'
                      : 'border-[#EADFD7] opacity-75 hover:opacity-100'
                  }`}
                >
                  <ResilientImage
                    src={imgUrl}
                    alt={`${title} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Purchase & Specifications Module Right */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#EADFD7] p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#706464]">{category}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#443B3B] text-balance">
              {title}
            </h1>
            <p className="text-2xl font-bold text-[#443B3B] tabular-nums">
              {formatTND(story.price, lang)}
            </p>
          </div>

          <p className="text-base text-[#706464] leading-relaxed">{description}</p>

          <Link
            to={`/customize/${story.id}`}
            data-testid="start-customize-cta"
            className="block w-full text-center py-4 px-6 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] transition-colors"
          >
            {t.customizeBtn}
          </Link>

          {/* Product Specifications */}
          <div className="pt-4 border-t border-[#EADFD7]">
            <dl className="divide-y divide-[#EADFD7]/70 text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specAge}</dt>
                <dd className="font-semibold text-[#443B3B] tabular-nums">
                  {story.ageRange} {t.yearsUnit}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specPages}</dt>
                <dd className="font-semibold text-[#443B3B] tabular-nums">
                  {story.pages} {t.pagesUnit}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specFormat}</dt>
                <dd className="font-semibold text-[#443B3B] tabular-nums" dir="ltr">
                  {story.format}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specPaper}</dt>
                <dd className="font-semibold text-[#443B3B] text-end">{story.paperType}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specBinding}</dt>
                <dd className="font-semibold text-[#443B3B] text-end">{story.bindingType}</dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specPrep}</dt>
                <dd className="font-semibold text-[#443B3B] text-end">
                  {story.prepTime || '3-4 أيام عمل / 3-4 jours'}
                </dd>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <dt className="text-[#706464]">{t.specLanguages}</dt>
                <dd className="font-semibold text-[#443B3B] text-end">{languageLabels}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
