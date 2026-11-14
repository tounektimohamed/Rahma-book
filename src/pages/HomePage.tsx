import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Gift, Palette, Printer, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStories } from '../hooks/useStories';
import { useStorefrontSettings } from '../hooks/useStorefrontSettings';
import { useStoryDomains } from '../hooks/useStoryDomains';
import { resolveStorefrontCopy } from '../types/storefront';
import { StoryCard } from '../components/stories/StoryCard';
import { StoryCardSkeleton } from '../components/common/StoryCardSkeleton';
import { ResilientImage } from '../components/common/ResilientImage';
import { getDomainLabel, getDomainSummary } from '../utils/storyDomains';

export function HomePage() {
  const { lang, t } = useLanguage();
  const { stories, loading, error, reload } = useStories();
  const { settings } = useStorefrontSettings();
  const { domains } = useStoryDomains(false);

  const storefront = resolveStorefrontCopy(settings, lang, t);

  const featuredStories = stories.filter((s) => s.featured && s.id !== 'story-custom-domain').slice(0, 3);
  const displayedFeatured =
    featuredStories.length > 0
      ? featuredStories
      : stories.filter((s) => s.id !== 'story-custom-domain').slice(0, 3);

  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 lg:pt-12 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p
              data-testid="home-hero-highlight"
              className="text-xs sm:text-sm font-semibold text-[#706464]"
            >
              {storefront.heroHighlight}
            </p>

            <h1
              data-testid="home-hero-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#443B3B] leading-tight text-balance"
            >
              {storefront.heroTitle}
            </h1>

            <p
              data-testid="home-hero-subtitle"
              className="text-base sm:text-lg text-[#706464] leading-relaxed max-w-xl"
            >
              {storefront.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/stories"
                data-testid="hero-explore-btn"
                className="px-6 py-3.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold hover:bg-[#332B2B] transition-colors whitespace-nowrap shrink-0"
              >
                {storefront.heroCtaPrimary}
              </Link>
              <Link
                to="/customize?mode=freeform"
                data-testid="hero-customize-btn"
                className="px-6 py-3.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold hover:bg-[#EE9E9E] transition-colors whitespace-nowrap shrink-0"
              >
                {storefront.heroCtaSecondary}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[300px] sm:min-h-[380px] rounded-3xl overflow-hidden bg-[#F8E8DC] border border-[#EADFD7] shadow-sm">
              <ResilientImage
                src={storefront.heroImage}
                alt={t.brandName}
                fallbackTitle={t.brandName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#EADFD7]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">
              {storefront.featuredTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#706464]">
              {storefront.featuredSubtitle}
            </p>
          </div>
          <Link
            to="/stories"
            className="text-sm font-bold text-[#443B3B] underline underline-offset-4 hover:text-[#706464] whitespace-nowrap shrink-0"
          >
            {t.viewAllStories}
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <StoryCardSkeleton />
            <StoryCardSkeleton />
            <StoryCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-[#EADFD7] bg-white p-8 text-center space-y-3">
            <h3 className="text-base font-bold text-[#443B3B]">{t.errorLoadTitle}</h3>
            <p className="text-sm text-[#706464]">{t.errorLoadDesc}</p>
            <button
              type="button"
              onClick={reload}
              className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-xs font-bold cursor-pointer"
            >
              {t.retryBtn}
            </button>
          </div>
        )}

        {!loading && !error && displayedFeatured.length === 0 && (
          <div
            data-testid="home-featured-empty"
            className="rounded-2xl border border-[#EADFD7] bg-white p-8 text-center space-y-3"
          >
            <h3 className="text-base font-bold text-[#443B3B]">{t.catalogNoStoriesTitle}</h3>
            <p className="text-sm text-[#706464] max-w-lg mx-auto">{t.catalogNoStoriesDesc}</p>
            <Link
              to="/customize?mode=freeform"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs font-bold hover:bg-[#EE9E9E] transition-colors"
            >
              {t.wizardModeFreeform}
            </Link>
          </div>
        )}

        {!loading && !error && displayedFeatured.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {displayedFeatured.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>

      {/* Open Story Domains & Parent Free-Form Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[#EADFD7]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">
              {storefront.domainsTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#706464]">
              {storefront.domainsSubtitle}
            </p>
          </div>
          <Link
            to="/customize?mode=freeform"
            data-testid="home-freeform-cta"
            className="text-sm font-bold text-[#443B3B] underline underline-offset-4 hover:text-[#706464] whitespace-nowrap shrink-0"
          >
            {t.customThemeCta}
          </Link>
        </div>

        {domains.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <Link
                key={domain.id}
                to={
                  domain.id === 'custom'
                    ? '/customize?mode=freeform'
                    : `/customize?domain=${domain.id}`
                }
                data-testid={`home-domain-${domain.id}`}
                className="group rounded-2xl bg-white border border-[#EADFD7] p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#F5B8B8]"
              >
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#443B3B] group-hover:underline underline-offset-4">
                    {getDomainLabel(domain, lang)}
                  </h3>
                  <p className="text-sm text-[#706464] leading-relaxed">
                    {getDomainSummary(domain, lang)}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#443B3B]/80">
                  {t.domainsStartBtn}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <Link
            to="/customize?mode=freeform"
            className="block rounded-2xl bg-white border border-[#EADFD7] p-6 hover:border-[#F5B8B8] transition-colors space-y-2"
          >
            <h3 className="text-base font-bold text-[#443B3B]">{t.wizardModeFreeform}</h3>
            <p className="text-sm text-[#706464]">{t.freeformPlotPlaceholder}</p>
            <span className="inline-block text-xs font-bold text-[#443B3B] underline underline-offset-4 pt-1">
              {t.customThemeCta}
            </span>
          </Link>
        )}
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-[#F8E8DC]/60 border-y border-[#EADFD7] py-14 lg:py-16 my-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">
              {t.howItWorksTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#706464]">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#F5B8B8]/40 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#443B3B]">{t.step1Title}</h3>
              <p className="text-sm text-[#706464] leading-relaxed">{t.step1Desc}</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#DCD6F7]/70 flex items-center justify-center">
                <Palette className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#443B3B]">{t.step2Title}</h3>
              <p className="text-sm text-[#706464] leading-relaxed">{t.step2Desc}</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADFD7] p-6 space-y-3">
              <div className="w-11 h-11 rounded-xl bg-[#B8CDBA]/50 flex items-center justify-center">
                <Gift className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#443B3B]">{t.step3Title}</h3>
              <p className="text-sm text-[#706464] leading-relaxed">{t.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why My Little Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#443B3B]">{t.whyTitle}</h2>
          <p className="text-sm sm:text-base text-[#706464]">{t.whySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-white border border-[#EADFD7] p-6 space-y-2.5">
            <ShieldCheck className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#443B3B]">{t.why1Title}</h3>
            <p className="text-sm text-[#706464] leading-relaxed">{t.why1Desc}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#EADFD7] p-6 space-y-2.5">
            <Palette className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#443B3B]">{t.why2Title}</h3>
            <p className="text-sm text-[#706464] leading-relaxed">{t.why2Desc}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#EADFD7] p-6 space-y-2.5">
            <Printer className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#443B3B]">{t.why3Title}</h3>
            <p className="text-sm text-[#706464] leading-relaxed">{t.why3Desc}</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#EADFD7] p-6 space-y-2.5">
            <Gift className="w-5 h-5 text-[#443B3B]" aria-hidden="true" />
            <h3 className="text-base font-bold text-[#443B3B]">{t.why4Title}</h3>
            <p className="text-sm text-[#706464] leading-relaxed">{t.why4Desc}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
