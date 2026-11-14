export type StoryLanguageCode = 'ar' | 'fr' | 'en';

export interface Story {
  id: string;
  title: string;
  titleFr?: string;
  titleEn?: string;
  slug: string;
  description: string;
  descriptionFr?: string;
  descriptionEn?: string;
  category: string;
  categoryFr?: string;
  categoryEn?: string;
  coverImage: string;
  gallery: string[];
  price: number;
  pages: number;
  format: string;
  paperType: string;
  bindingType: string;
  ageRange: string;
  prepTime?: string;
  language: StoryLanguageCode[];
  featured?: boolean;
  active: boolean;
  createdAt?: unknown;
}

export type SortOption = 'featured' | 'price-asc' | 'price-desc';
export type PriceRangeOption = 'all' | 'under-65' | '65-and-over';

export interface CatalogFilterState {
  search: string;
  category: string;
  priceRange: PriceRangeOption;
  sortBy: SortOption;
}
