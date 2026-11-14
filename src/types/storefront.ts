import type { UILanguage } from './i18n';

export interface StorefrontSettings {
  heroHighlightAr: string;
  heroHighlightFr: string;
  heroHighlightEn: string;
  heroTitleAr: string;
  heroTitleFr: string;
  heroTitleEn: string;
  heroSubtitleAr: string;
  heroSubtitleFr: string;
  heroSubtitleEn: string;
  heroCtaPrimaryAr: string;
  heroCtaPrimaryFr: string;
  heroCtaPrimaryEn: string;
  heroCtaSecondaryAr: string;
  heroCtaSecondaryFr: string;
  heroCtaSecondaryEn: string;
  heroImage: string;
  featuredTitleAr: string;
  featuredTitleFr: string;
  featuredTitleEn: string;
  featuredSubtitleAr: string;
  featuredSubtitleFr: string;
  featuredSubtitleEn: string;
  domainsTitleAr: string;
  domainsTitleFr: string;
  domainsTitleEn: string;
  domainsSubtitleAr: string;
  domainsSubtitleFr: string;
  domainsSubtitleEn: string;
  customBookPrice?: number;
  contactPhone?: string;
  contactEmail?: string;
  contactLocation?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  updatedAt?: unknown;
}

export const DEFAULT_HERO_IMAGE = '/src/assets/images/hero_storybook_mockup_1794606419841.jpg';

export interface ResolvedStorefrontCopy {
  heroHighlight: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroImage: string;
  featuredTitle: string;
  featuredSubtitle: string;
  domainsTitle: string;
  domainsSubtitle: string;
  customBookPrice: number;
  contactPhone: string;
  contactEmail: string;
  contactLocation: string;
  instagramUrl: string;
  facebookUrl: string;
}

export interface StorefrontDefaults {
  heroHighlight: string;
  heroTitle: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  featuredTitle: string;
  featuredSubtitle: string;
  domainsSectionTitle: string;
  domainsSectionSubtitle: string;
  footerLocation?: string;
  footerEmail?: string;
}

function pickLocalized(
  settings: Partial<StorefrontSettings> | null | undefined,
  arKey: keyof StorefrontSettings,
  frKey: keyof StorefrontSettings,
  enKey: keyof StorefrontSettings,
  lang: UILanguage,
  fallback: string
): string {
  if (!settings) return fallback;
  const raw =
    lang === 'fr'
      ? settings[frKey] || settings[arKey]
      : lang === 'en'
      ? settings[enKey] || settings[arKey]
      : settings[arKey];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }
  return fallback;
}

export function resolveStorefrontCopy(
  settings: Partial<StorefrontSettings> | null | undefined,
  lang: UILanguage,
  defaults: StorefrontDefaults
): ResolvedStorefrontCopy {
  return {
    heroHighlight: pickLocalized(
      settings,
      'heroHighlightAr',
      'heroHighlightFr',
      'heroHighlightEn',
      lang,
      defaults.heroHighlight
    ),
    heroTitle: pickLocalized(
      settings,
      'heroTitleAr',
      'heroTitleFr',
      'heroTitleEn',
      lang,
      defaults.heroTitle
    ),
    heroSubtitle: pickLocalized(
      settings,
      'heroSubtitleAr',
      'heroSubtitleFr',
      'heroSubtitleEn',
      lang,
      defaults.heroSubtitle
    ),
    heroCtaPrimary: pickLocalized(
      settings,
      'heroCtaPrimaryAr',
      'heroCtaPrimaryFr',
      'heroCtaPrimaryEn',
      lang,
      defaults.heroPrimaryCta
    ),
    heroCtaSecondary: pickLocalized(
      settings,
      'heroCtaSecondaryAr',
      'heroCtaSecondaryFr',
      'heroCtaSecondaryEn',
      lang,
      defaults.heroSecondaryCta
    ),
    heroImage:
      settings?.heroImage && settings.heroImage.trim().length >= 5
        ? settings.heroImage.trim()
        : DEFAULT_HERO_IMAGE,
    featuredTitle: pickLocalized(
      settings,
      'featuredTitleAr',
      'featuredTitleFr',
      'featuredTitleEn',
      lang,
      defaults.featuredTitle
    ),
    featuredSubtitle: pickLocalized(
      settings,
      'featuredSubtitleAr',
      'featuredSubtitleFr',
      'featuredSubtitleEn',
      lang,
      defaults.featuredSubtitle
    ),
    domainsTitle: pickLocalized(
      settings,
      'domainsTitleAr',
      'domainsTitleFr',
      'domainsTitleEn',
      lang,
      defaults.domainsSectionTitle
    ),
    domainsSubtitle: pickLocalized(
      settings,
      'domainsSubtitleAr',
      'domainsSubtitleFr',
      'domainsSubtitleEn',
      lang,
      defaults.domainsSectionSubtitle
    ),
    customBookPrice:
      typeof settings?.customBookPrice === 'number' && settings.customBookPrice > 0
        ? settings.customBookPrice
        : 69,
    contactPhone: (settings?.contactPhone || '').trim(),
    contactEmail: (settings?.contactEmail || defaults.footerEmail || '').trim(),
    contactLocation: (settings?.contactLocation || defaults.footerLocation || '').trim(),
    instagramUrl: (settings?.instagramUrl || '').trim(),
    facebookUrl: (settings?.facebookUrl || '').trim(),
  };
}
