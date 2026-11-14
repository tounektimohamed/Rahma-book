import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase/firebase';
import { ImageService } from '../images/ImageService';
import type { Story } from '../../types/story';

const STORIES_COLLECTION = 'stories';

function mapDocToStory(id: string, data: Record<string, unknown>): Story {
  return {
    id,
    title: String(data.title ?? ''),
    titleFr: typeof data.titleFr === 'string' ? data.titleFr : undefined,
    titleEn: typeof data.titleEn === 'string' ? data.titleEn : undefined,
    slug: String(data.slug ?? id),
    description: String(data.description ?? ''),
    descriptionFr: typeof data.descriptionFr === 'string' ? data.descriptionFr : undefined,
    descriptionEn: typeof data.descriptionEn === 'string' ? data.descriptionEn : undefined,
    category: String(data.category ?? ''),
    categoryFr: typeof data.categoryFr === 'string' ? data.categoryFr : undefined,
    categoryEn: typeof data.categoryEn === 'string' ? data.categoryEn : undefined,
    coverImage: String(data.coverImage ?? ''),
    gallery: Array.isArray(data.gallery) ? data.gallery.map(String) : [],
    price: Number(data.price ?? 0),
    pages: Number(data.pages ?? 24),
    format: String(data.format ?? '21 × 25 cm'),
    paperType: String(data.paperType ?? ''),
    bindingType: String(data.bindingType ?? ''),
    ageRange: String(data.ageRange ?? '3-8'),
    prepTime: typeof data.prepTime === 'string' ? data.prepTime : undefined,
    language: Array.isArray(data.language)
      ? (data.language as Story['language'])
      : ['ar', 'fr', 'en'],
    featured: Boolean(data.featured),
    active: Boolean(data.active),
    createdAt: data.createdAt,
  };
}

export async function fetchActiveStories(): Promise<Story[]> {
  try {
    const q = query(collection(db, STORIES_COLLECTION), where('active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      mapDocToStory(docSnap.id, docSnap.data() as Record<string, unknown>)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, STORIES_COLLECTION);
  }
}

export async function fetchStoryById(storyId: string): Promise<Story | null> {
  try {
    const docRef = doc(db, STORIES_COLLECTION, storyId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const story = mapDocToStory(snap.id, snap.data() as Record<string, unknown>);
    return story.active ? story : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${STORIES_COLLECTION}/${storyId}`);
  }
}

export async function fetchAllStoriesForAdmin(): Promise<Story[]> {
  try {
    const snapshot = await getDocs(collection(db, STORIES_COLLECTION));
    return snapshot.docs.map((docSnap) =>
      mapDocToStory(docSnap.id, docSnap.data() as Record<string, unknown>)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, STORIES_COLLECTION);
  }
}

export async function saveStoryByAdmin(
  story: Story,
  options: { isNew: boolean }
): Promise<void> {
  const { id, titleFr, titleEn, descriptionFr, descriptionEn, categoryFr, categoryEn, prepTime, createdAt } =
    story;

  const cleanGallery = story.gallery
    .map((g) => g.trim())
    .filter((g) => g.length >= 5)
    .slice(0, 6);
  if (cleanGallery.length === 0 && story.coverImage.trim().length >= 5) {
    cleanGallery.push(story.coverImage.trim());
  }

  const payload: Record<string, unknown> = {
    title: story.title.trim(),
    slug: story.slug.trim().toLowerCase(),
    description: story.description.trim(),
    category: story.category.trim(),
    coverImage: story.coverImage.trim(),
    gallery: cleanGallery,
    price: Number(story.price),
    pages: Math.round(Number(story.pages)),
    format: story.format.trim(),
    paperType: story.paperType.trim(),
    bindingType: story.bindingType.trim(),
    ageRange: story.ageRange.trim(),
    language: story.language.length > 0 ? story.language : ['ar', 'fr', 'en'],
    featured: Boolean(story.featured),
    active: Boolean(story.active),
    createdAt: options.isNew || !createdAt ? serverTimestamp() : createdAt,
  };

  if (titleFr && titleFr.trim().length >= 2) payload.titleFr = titleFr.trim();
  if (titleEn && titleEn.trim().length >= 2) payload.titleEn = titleEn.trim();
  if (descriptionFr && descriptionFr.trim().length >= 10) {
    payload.descriptionFr = descriptionFr.trim();
  }
  if (descriptionEn && descriptionEn.trim().length >= 10) {
    payload.descriptionEn = descriptionEn.trim();
  }
  if (categoryFr && categoryFr.trim().length >= 2) payload.categoryFr = categoryFr.trim();
  if (categoryEn && categoryEn.trim().length >= 2) payload.categoryEn = categoryEn.trim();
  if (prepTime && prepTime.trim().length >= 2) payload.prepTime = prepTime.trim();

  const sizeCheck = ImageService.validateFirestoreDocumentSize({
    ...payload,
    createdAt: new Date().toISOString(),
  });
  if (!sizeCheck.valid) {
    throw new Error('STORY_DOCUMENT_TOO_LARGE');
  }

  try {
    await setDoc(doc(db, STORIES_COLLECTION, id), payload);
  } catch (error) {
    handleFirestoreError(
      error,
      options.isNew ? OperationType.CREATE : OperationType.UPDATE,
      `${STORIES_COLLECTION}/${id}`
    );
  }
}

export async function toggleStoryFlagByAdmin(
  storyId: string,
  field: 'active' | 'featured',
  value: boolean
): Promise<void> {
  try {
    await updateDoc(doc(db, STORIES_COLLECTION, storyId), { [field]: value });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STORIES_COLLECTION}/${storyId}`);
  }
}

export async function deleteStoryByAdmin(storyId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, STORIES_COLLECTION, storyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STORIES_COLLECTION}/${storyId}`);
  }
}

export async function deleteStoriesBatchByAdmin(storyIds: string[]): Promise<void> {
  for (const id of storyIds) {
    await deleteStoryByAdmin(id);
  }
}
