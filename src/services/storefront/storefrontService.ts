import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase/firebase';
import { ImageService } from '../images/ImageService';
import type { StorefrontSettings } from '../../types/storefront';
import { filterAndSortDomains, type StoryDomain } from '../../utils/storyDomains';

const SETTINGS_COLLECTION = 'settings';
const STOREFRONT_DOC_ID = 'storefront';
const STORY_DOMAINS_COLLECTION = 'storyDomains';

export async function fetchStorefrontSettings(): Promise<StorefrontSettings | null> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, STOREFRONT_DOC_ID));
    if (!snap.exists()) return null;
    return snap.data() as StorefrontSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${STOREFRONT_DOC_ID}`);
  }
}

export async function saveStorefrontSettingsByAdmin(
  payload: Omit<StorefrontSettings, 'updatedAt'>
): Promise<void> {
  const cleanPayload: Record<string, unknown> = {
    heroHighlightAr: payload.heroHighlightAr.trim(),
    heroHighlightFr: payload.heroHighlightFr.trim(),
    heroHighlightEn: payload.heroHighlightEn.trim(),
    heroTitleAr: payload.heroTitleAr.trim(),
    heroTitleFr: payload.heroTitleFr.trim(),
    heroTitleEn: payload.heroTitleEn.trim(),
    heroSubtitleAr: payload.heroSubtitleAr.trim(),
    heroSubtitleFr: payload.heroSubtitleFr.trim(),
    heroSubtitleEn: payload.heroSubtitleEn.trim(),
    heroCtaPrimaryAr: payload.heroCtaPrimaryAr.trim(),
    heroCtaPrimaryFr: payload.heroCtaPrimaryFr.trim(),
    heroCtaPrimaryEn: payload.heroCtaPrimaryEn.trim(),
    heroCtaSecondaryAr: payload.heroCtaSecondaryAr.trim(),
    heroCtaSecondaryFr: payload.heroCtaSecondaryFr.trim(),
    heroCtaSecondaryEn: payload.heroCtaSecondaryEn.trim(),
    heroImage: payload.heroImage.trim(),
    featuredTitleAr: payload.featuredTitleAr.trim(),
    featuredTitleFr: payload.featuredTitleFr.trim(),
    featuredTitleEn: payload.featuredTitleEn.trim(),
    featuredSubtitleAr: payload.featuredSubtitleAr.trim(),
    featuredSubtitleFr: payload.featuredSubtitleFr.trim(),
    featuredSubtitleEn: payload.featuredSubtitleEn.trim(),
    domainsTitleAr: payload.domainsTitleAr.trim(),
    domainsTitleFr: payload.domainsTitleFr.trim(),
    domainsTitleEn: payload.domainsTitleEn.trim(),
    domainsSubtitleAr: payload.domainsSubtitleAr.trim(),
    domainsSubtitleFr: payload.domainsSubtitleFr.trim(),
    domainsSubtitleEn: payload.domainsSubtitleEn.trim(),
    customBookPrice: Number(payload.customBookPrice || 69),
    contactPhone: (payload.contactPhone || '').trim(),
    contactEmail: (payload.contactEmail || '').trim(),
    contactLocation: (payload.contactLocation || '').trim(),
    instagramUrl: (payload.instagramUrl || '').trim(),
    facebookUrl: (payload.facebookUrl || '').trim(),
    updatedAt: serverTimestamp(),
  };

  const sizeCheck = ImageService.validateFirestoreDocumentSize({
    ...cleanPayload,
    updatedAt: new Date().toISOString(),
  });
  if (!sizeCheck.valid) {
    throw new Error('STOREFRONT_SETTINGS_TOO_LARGE');
  }

  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, STOREFRONT_DOC_ID), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${STOREFRONT_DOC_ID}`);
  }
}

function mapDocToDomain(id: string, data: Record<string, unknown>): StoryDomain {
  return {
    id,
    label: {
      ar: String(data.labelAr ?? ''),
      fr: String(data.labelFr ?? data.labelAr ?? ''),
      en: String(data.labelEn ?? data.labelAr ?? ''),
    },
    summary: {
      ar: String(data.summaryAr ?? ''),
      fr: String(data.summaryFr ?? data.summaryAr ?? ''),
      en: String(data.summaryEn ?? data.summaryAr ?? ''),
    },
    subtopics: {
      ar: Array.isArray(data.subtopicsAr) ? data.subtopicsAr.map(String) : [],
      fr: Array.isArray(data.subtopicsFr) ? data.subtopicsFr.map(String) : [],
      en: Array.isArray(data.subtopicsEn) ? data.subtopicsEn.map(String) : [],
    },
    recommendedStoryId: String(data.recommendedStoryId ?? 'custom-freeform'),
    coverPreview: String(
      data.coverPreview ?? '/src/assets/images/hero_storybook_mockup_1794606419841.jpg'
    ),
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 100,
    active: data.active !== false,
  };
}

export async function fetchStoryDomains(includeInactive: boolean = false): Promise<StoryDomain[]> {
  try {
    const colRef = collection(db, STORY_DOMAINS_COLLECTION);
    const snapshot = includeInactive
      ? await getDocs(colRef)
      : await getDocs(query(colRef, where('active', '==', true)));

    const records = snapshot.docs.map((d) =>
      mapDocToDomain(d.id, d.data() as Record<string, unknown>)
    );
    return filterAndSortDomains(records, includeInactive);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, STORY_DOMAINS_COLLECTION);
  }
}

export async function saveStoryDomainByAdmin(domain: StoryDomain): Promise<void> {
  const cleanId = domain.id.trim();
  const payload = {
    labelAr: domain.label.ar.trim(),
    labelFr: (domain.label.fr || domain.label.ar).trim(),
    labelEn: (domain.label.en || domain.label.ar).trim(),
    summaryAr: domain.summary.ar.trim(),
    summaryFr: (domain.summary.fr || domain.summary.ar).trim(),
    summaryEn: (domain.summary.en || domain.summary.ar).trim(),
    subtopicsAr: domain.subtopics.ar.filter((s) => s.trim().length > 0).slice(0, 8),
    subtopicsFr: domain.subtopics.fr.filter((s) => s.trim().length > 0).slice(0, 8),
    subtopicsEn: domain.subtopics.en.filter((s) => s.trim().length > 0).slice(0, 8),
    recommendedStoryId: domain.recommendedStoryId || 'custom-freeform',
    coverPreview:
      domain.coverPreview || '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
    sortOrder: Math.max(0, Math.min(500, Math.floor(domain.sortOrder ?? 100))),
    active: domain.active !== false,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, STORY_DOMAINS_COLLECTION, cleanId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STORY_DOMAINS_COLLECTION}/${cleanId}`);
  }
}

export async function deleteStoryDomainByAdmin(domainId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STORY_DOMAINS_COLLECTION, domainId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STORY_DOMAINS_COLLECTION}/${domainId}`);
  }
}
