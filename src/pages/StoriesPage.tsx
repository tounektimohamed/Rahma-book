import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStories } from '../hooks/useStories';
import { useStoryDomains } from '../hooks/useStoryDomains';
import type { PriceRangeOption, SortOption } from '../types/story';
import {
  extractUniqueCategories,
  filterAndSortStories,
} from '../utils/catalogFilter';
import { getDomainLabel, getDomainSummary } from '../utils/storyDomains';
import { StoryCard } from '../components/stories/StoryCard';
import { StoryCardSkeleton } from '../components/common/StoryCardSkeleton';

export function StoriesPage() {
  const { lang, t } = useLanguage();
  const { stories, loading, error, reload } = useStories();
  const { domains } = useStoryDomains(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState<PriceRangeOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const catalogStories = useMemo(
    () => stories.filter((s) => s.id !== 'story-custom-domain'),
    [stories]
  );

  const categories = useMemo(
    () => extractUniqueCategories(catalogStories, lang),
    [catalogStories, lang]
  );

  const visibleStories = useMemo(
    () =>
      filterAndSortStories(catalogStories, {
        search,
        category,
        priceRange,
        sortBy,
      }),
    [catalogStories, search, category, priceRange, sortBy]
  );

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setPriceRange('all');
    setSortBy('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-3xl font-bold text-[#443B3B]">{t.catalogTitle}</h1>
          <p className="text-base text-[#706464]">{t.catalogSubtitle}</p>
        </div>
        <Link
          to="/customize?mode=freeform"
          className="px-5 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-xs sm:text-sm font-bold hover:bg-[#EE9E9E] transition-colors whitespace-nowrap shrink-0 self-start"
        >
          {t.wizardModeFreeform}
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EADFD7] p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <label htmlFor="catalog-search" className="sr-only">
              {t.searchPlaceholder}
            </label>
            <Search
              className="w-4 h-4 text-[#706464] absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] ps-10 pe-4 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
            />
          </div>

          {/* Price Filter */}
          <div className="md:col-span-3">
            <label htmlFor="catalog-price-filter" className="sr-only">
              {t.priceFilterAll}
            </label>
            <select
              id="catalog-price-filter"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRangeOption)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
            >
              <option value="all">{t.priceFilterAll}</option>
              <option value="under-65">{t.priceFilterUnder65}</option>
              <option value="65-and-over">{t.priceFilter65Plus}</option>
            </select>
          </div>

          {/* Sort by Price */}
          <div className="md:col-span-4">
            <label htmlFor="catalog-sort" className="sr-only">
              {t.sortFeatured}
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-xl border border-[#EADFD7] bg-[#FFF9F2] px-3.5 py-2.5 text-sm text-[#443B3B] focus:outline-2 focus:outline-[#443B3B]"
            >
              <option value="featured">{t.sortFeatured}</option>
              <option value="price-asc">{t.sortPriceAsc}</option>
              <option value="price-desc">{t.sortPriceDesc}</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              category === 'all'
                ? 'bg-[#443B3B] text-[#FFF9F2]'
                : 'bg-[#F8E8DC] text-[#443B3B] hover:bg-[#F5B8B8]/60'
            }`}
          >
            {t.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              aria-pressed={category === cat.key}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                category === cat.key
                  ? 'bg-[#443B3B] text-[#FFF9F2]'
                  : 'bg-[#F8E8DC] text-[#443B3B] hover:bg-[#F5B8B8]/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <StoryCardSkeleton />
          <StoryCardSkeleton />
          <StoryCardSkeleton />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-[#EADFD7] bg-white p-10 text-center space-y-3">
          <h2 className="text-lg font-bold text-[#443B3B]">{t.errorLoadTitle}</h2>
          <p className="text-sm text-[#706464]">{t.errorLoadDesc}</p>
          <button
            type="button"
            onClick={reload}
            className="px-5 py-2.5 rounded-xl bg-[#443B3B] text-[#FFF9F2] text-sm font-bold cursor-pointer"
          >
            {t.retryBtn}
          </button>
        </div>
      )}

      {!loading && !error && catalogStories.length === 0 && (
        <div
          data-testid="catalog-empty-state"
          className="rounded-2xl border border-[#EADFD7] bg-white p-10 text-center space-y-3"
        >
          <h2 className="text-lg font-bold text-[#443B3B]">{t.catalogNoStoriesTitle}</h2>
          <p className="text-sm text-[#706464]">{t.catalogNoStoriesDesc}</p>
          <Link
            to="/customize?mode=freeform"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold"
          >
            {t.wizardModeFreeform}
          </Link>
        </div>
      )}

      {!loading && !error && catalogStories.length > 0 && visibleStories.length === 0 && (
        <div className="rounded-2xl border border-[#EADFD7] bg-white p-10 text-center space-y-3">
          <h2 className="text-lg font-bold text-[#443B3B]">{t.emptyResultsTitle}</h2>
          <p className="text-sm text-[#706464]">{t.emptyResultsDesc}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-[#F5B8B8] text-[#443B3B] text-sm font-bold cursor-pointer"
          >
            {t.resetFilters}
          </button>
        </div>
      )}

      {!loading && !error && visibleStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {visibleStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {/* Open Domains Section on Catalog (loaded strictly from Firestore) */}
      {domains.length > 0 && (
        <section className="pt-8 border-t border-[#EADFD7] space-y-5">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-2xl font-bold text-[#443B3B]">{t.domainsSectionTitle}</h2>
            <p className="text-sm text-[#706464]">{t.domainsSectionSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <Link
                key={domain.id}
                to={
                  domain.id === 'custom'
                    ? '/customize?mode=freeform'
                    : `/customize?domain=${domain.id}`
                }
                className="rounded-2xl bg-white border border-[#EADFD7] p-5 flex flex-col justify-between gap-2 hover:border-[#F5B8B8] hover:shadow-sm transition-all"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#443B3B]">
                    {getDomainLabel(domain, lang)}
                  </h3>
                  <p className="text-xs text-[#706464] leading-relaxed">
                    {getDomainSummary(domain, lang)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#443B3B] underline underline-offset-4">
                  {t.domainsStartBtn}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
