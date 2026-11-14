import type { StoryLanguageCode } from './story';

export interface CartItem {
  customizationId: string;
  storyId: string;
  storyTitle: string;
  storyTitleFr?: string;
  storyTitleEn?: string;
  storyDomain?: string;
  storyIdea?: string;
  coverImage: string;
  childName: string;
  childAge: number;
  language: StoryLanguageCode;
  dedication: string;
  childPhotoBase64: string;
  unitPrice: number;
  quantity: number;
}

export interface CustomizationDraft {
  storyId: string;
  storyDomain?: string;
  storyIdea?: string;
  childName: string;
  childAge: number;
  language: StoryLanguageCode;
  dedication: string;
  childPhotoBase64: string;
}
