import type { UILanguage } from '../types/i18n';

export type StoryDomainId = string;

export interface StoryDomain {
  id: StoryDomainId;
  label: Record<UILanguage, string>;
  summary: Record<UILanguage, string>;
  subtopics: Record<UILanguage, string[]>;
  recommendedStoryId: string;
  coverPreview: string;
  sortOrder?: number;
  active?: boolean;
}

export function filterAndSortDomains(
  domains: StoryDomain[],
  includeInactive: boolean = false
): StoryDomain[] {
  const sorted = [...domains].sort(
    (a, b) => (a.sortOrder ?? 100) - (b.sortOrder ?? 100)
  );
  return includeInactive ? sorted : sorted.filter((d) => d.active !== false);
}

export function getDomainById(
  id: string | null | undefined,
  list: StoryDomain[] = []
): StoryDomain | undefined {
  if (!id) return undefined;
  return list.find((d) => d.id === id);
}

export function getDomainLabel(domain: StoryDomain, lang: UILanguage): string {
  return domain.label[lang] || domain.label.ar;
}

export function getDomainSummary(domain: StoryDomain, lang: UILanguage): string {
  return domain.summary[lang] || domain.summary.ar;
}

export function getDomainSubtopics(domain: StoryDomain, lang: UILanguage): string[] {
  return domain.subtopics[lang]?.length ? domain.subtopics[lang] : domain.subtopics.ar;
}
