import type { CatalogFilterState, Story } from '../types/story';
import type { UILanguage } from '../types/i18n';

export function getLocalizedStoryTitle(story: Pick<Story, 'title' | 'titleFr' | 'titleEn'>, lang: UILanguage): string {
  if (lang === 'fr' && story.titleFr) return story.titleFr;
  if (lang === 'en' && story.titleEn) return story.titleEn;
  return story.title;
}

export function getLocalizedStoryDescription(
  story: Pick<Story, 'description' | 'descriptionFr' | 'descriptionEn'>,
  lang: UILanguage
): string {
  if (lang === 'fr' && story.descriptionFr) return story.descriptionFr;
  if (lang === 'en' && story.descriptionEn) return story.descriptionEn;
  return story.description;
}

export function getLocalizedStoryCategory(
  story: Pick<Story, 'category' | 'categoryFr' | 'categoryEn'>,
  lang: UILanguage
): string {
  if (lang === 'fr' && story.categoryFr) return story.categoryFr;
  if (lang === 'en' && story.categoryEn) return story.categoryEn;
  return story.category;
}

export function filterAndSortStories(
  stories: Story[],
  filters: CatalogFilterState
): Story[] {
  const query = filters.search.trim().toLowerCase();

  const filtered = stories.filter((story) => {
    if (!story.active) return false;

    if (query) {
      const searchable = [
        story.title,
        story.titleFr ?? '',
        story.titleEn ?? '',
        story.category,
        story.categoryFr ?? '',
        story.categoryEn ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (filters.category && filters.category !== 'all') {
      if (story.category !== filters.category) return false;
    }

    if (filters.priceRange === 'under-65' && story.price >= 65) return false;
    if (filters.priceRange === '65-and-over' && story.price < 65) return false;

    return true;
  });

  const sorted = [...filtered];
  if (filters.sortBy === 'price-asc') {
    sorted.sort((a, b) => a.price - b.price);
  } else if (filters.sortBy === 'price-desc') {
    sorted.sort((a, b) => b.price - a.price);
  } else {
    sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }

  return sorted;
}

export function extractUniqueCategories(stories: Story[], lang: UILanguage): Array<{ key: string; label: string }> {
  const seen = new Map<string, string>();
  for (const s of stories) {
    if (!s.active) continue;
    if (!seen.has(s.category)) {
      seen.set(s.category, getLocalizedStoryCategory(s, lang));
    }
  }
  return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
}
