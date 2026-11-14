import type { AdminOrderRecord } from '../services/orders/ordersService';
import type { Story } from '../types/story';

export type BookFontFamily =
  | 'Cairo'
  | 'Tajawal'
  | 'Amiri'
  | 'Reem Kufi'
  | 'Lemonada'
  | 'Poppins';

export type BookPageLayout = 'over' | 'split';
export type BookTextAlign = 'right' | 'center' | 'left';
export type BookImageFit = 'cover' | 'contain';
export type ChildBadgeCorner = 'top-right' | 'top-left' | 'bottom-center';

export interface BookPage {
  id: string;
  img: string;
  text: string;
  x: number;
  y: number;
  w: number;
  size: number;
  lineHeight: number;
  color: string;
  bg: string;
  a: number;
  al: BookTextAlign;
  font: BookFontFamily;
  bold: boolean;
  textShadow: boolean;
  radius: number;
  fit: BookImageFit;
  layout: BookPageLayout;
  imgZoom: number;
  imgPosX: number;
  imgPosY: number;
  frameBorder: boolean;
  showChildBadge: boolean;
  childBadgeCorner: ChildBadgeCorner;
  childBadgeSize: number;
}

export interface LinkedOrderMeta {
  orderId: string;
  orderNumber: string;
  itemIndex: number;
  childName: string;
  childAge: number;
  language: 'ar' | 'fr' | 'en';
  storyId: string;
  storyTitle: string;
  storyDomain?: string;
  storyIdea?: string;
  dedication?: string;
  childPhotoBase64: string;
}

export interface StoryBookProject {
  id: string;
  title: string;
  author: string;
  w: number;
  h: number;
  rtl: boolean;
  pages: BookPage[];
  childPhotoAsset?: string;
  linkedOrder?: LinkedOrderMeta;
  updatedAt: string;
}

export interface BookSizePreset {
  id: string;
  labelAr: string;
  labelEn: string;
  w: number;
  h: number;
}

export const BOOK_SIZE_PRESETS: BookSizePreset[] = [
  { id: '148,210', labelAr: 'A5 عمودي (148×210 مم)', labelEn: 'A5 Portrait (148×210 mm)', w: 148, h: 210 },
  { id: '210,250', labelAr: 'كتالوج قياسي (210×250 مم)', labelEn: 'Catalog Standard (210×250 mm)', w: 210, h: 250 },
  { id: '210,297', labelAr: 'A4 عمودي (210×297 مم)', labelEn: 'A4 Portrait (210×297 mm)', w: 210, h: 297 },
  { id: '200,200', labelAr: 'مربع 20×20 سم', labelEn: 'Square 20×20 cm', w: 200, h: 200 },
  { id: '210,148', labelAr: 'A5 أفقي (210×148 مم)', labelEn: 'A5 Landscape (210×148 mm)', w: 210, h: 148 },
];

export interface PaperSizeOption {
  id: string;
  labelAr: string;
  labelEn: string;
  w: number;
  h: number;
}

export const PRINT_PAPER_OPTIONS: PaperSizeOption[] = [
  { id: '297,210', labelAr: 'A4 أفقي (297×210 مم)', labelEn: 'A4 Landscape', w: 297, h: 210 },
  { id: '420,297', labelAr: 'A3 أفقي (420×297 مم)', labelEn: 'A3 Landscape', w: 420, h: 297 },
  { id: '279,216', labelAr: 'Letter أفقي (279×216 مم)', labelEn: 'Letter Landscape', w: 279, h: 216 },
];

export interface PageStylePreset {
  id: string;
  labelAr: string;
  labelEn: string;
  patch: Partial<BookPage>;
}

export const PAGE_STYLE_PRESETS: PageStylePreset[] = [
  {
    id: 'warm-cream',
    labelAr: 'كريمي دافئ (أسفل)',
    labelEn: 'Warm Cream (Bottom)',
    patch: {
      layout: 'over',
      color: '#443B3B',
      bg: '#FFF9F2',
      a: 0.88,
      y: 72,
      x: 6,
      w: 88,
      bold: true,
      textShadow: false,
      radius: 3,
      frameBorder: false,
    },
  },
  {
    id: 'night-glow',
    labelAr: 'ليلي شفاف فوق الصورة',
    labelEn: 'Dark Translucent',
    patch: {
      layout: 'over',
      color: '#FFFFFF',
      bg: '#1E1918',
      a: 0.55,
      y: 70,
      x: 6,
      w: 88,
      bold: true,
      textShadow: true,
      radius: 2,
      frameBorder: false,
    },
  },
  {
    id: 'split-pastel',
    labelAr: 'صورة أعلى + نص أسفل',
    labelEn: 'Split Card',
    patch: {
      layout: 'split',
      color: '#443B3B',
      bg: '#FFF9F2',
      a: 1,
      al: 'center',
      bold: true,
      textShadow: false,
      frameBorder: true,
    },
  },
  {
    id: 'classic-dedication',
    labelAr: 'بطاقة إهداء مؤطرة',
    labelEn: 'Classic Framed',
    patch: {
      layout: 'over',
      color: '#443B3B',
      bg: '#F8E8DC',
      a: 0.92,
      y: 34,
      x: 10,
      w: 80,
      size: 4.8,
      font: 'Amiri',
      bold: true,
      textShadow: false,
      radius: 4,
      frameBorder: true,
    },
  },
];

function createPageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pg_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `pg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createDefaultBookPage(overrides: Partial<BookPage> = {}): BookPage {
  return {
    id: createPageId(),
    img: '',
    text: '',
    x: 6,
    y: 70,
    w: 88,
    size: 5,
    lineHeight: 1.5,
    color: '#ffffff',
    bg: '#1c1713',
    a: 0.5,
    al: 'center',
    font: 'Cairo',
    bold: true,
    textShadow: true,
    radius: 2,
    fit: 'cover',
    layout: 'over',
    imgZoom: 1,
    imgPosX: 50,
    imgPosY: 50,
    frameBorder: false,
    showChildBadge: false,
    childBadgeCorner: 'top-right',
    childBadgeSize: 22,
    ...overrides,
  };
}

export function createBlankBookProject(params: {
  id?: string;
  title?: string;
  author?: string;
  contentPagesCount?: number;
  w?: number;
  h?: number;
  rtl?: boolean;
}): StoryBookProject {
  const n = Math.max(1, Math.min(60, Math.floor(params.contentPagesCount ?? 8)));
  const title = params.title?.trim() || 'قصتي الجديدة';
  const author = params.author?.trim() || '';
  const rtl = params.rtl ?? true;
  const pages = Array.from({ length: n + 2 }, () =>
    createDefaultBookPage({
      font: rtl ? 'Cairo' : 'Poppins',
    })
  );

  pages[0] = createDefaultBookPage({
    text: title + (author ? `\n${author}` : ''),
    y: 38,
    size: 7.4,
    w: 88,
    font: rtl ? 'Cairo' : 'Poppins',
    color: '#443B3B',
    bg: '#FFF9F2',
    a: 0.88,
    textShadow: false,
    frameBorder: true,
  });

  pages[pages.length - 1] = createDefaultBookPage({
    text: 'My Little Story\nEvery Picture Has a Story.',
    y: 42,
    size: 4.4,
    w: 84,
    font: 'Poppins',
    color: '#443B3B',
    bg: '#F8E8DC',
    a: 0.94,
    textShadow: false,
    frameBorder: true,
  });

  return {
    id: params.id || `custom_${Date.now()}`,
    title,
    author,
    w: Math.max(80, Math.min(400, params.w || 148)),
    h: Math.max(80, Math.min(400, params.h || 210)),
    rtl,
    pages,
    updatedAt: new Date().toISOString(),
  };
}

function parseBookDimensionsFromFormat(formatStr: string | undefined): { w: number; h: number } {
  if (!formatStr) return { w: 148, h: 210 };
  const nums = formatStr.match(/\d+/g)?.map(Number) || [];
  if (nums.length >= 2 && nums[0] >= 10 && nums[1] >= 10) {
    // Convert cm like "21 × 25 cm" to mm
    const wMm = nums[0] < 60 ? nums[0] * 10 : nums[0];
    const hMm = nums[1] < 60 ? nums[1] * 10 : nums[1];
    return { w: wMm, h: hMm };
  }
  return { w: 148, h: 210 };
}

export function getOrderProjectKey(orderId: string, itemIndex: number): string {
  return `order:${orderId}:${itemIndex}`;
}

export function buildBookProjectFromOrderItem(params: {
  order: AdminOrderRecord;
  itemIndex: number;
  story?: Story | null;
  resolveImageUrl?: (src: string) => string;
}): StoryBookProject {
  const item = params.order.items[params.itemIndex];
  if (!item) {
    throw new Error('ORDER_ITEM_NOT_FOUND');
  }

  const resolveImg = params.resolveImageUrl || ((s: string) => s);
  const rtl = item.language === 'ar';
  const font: BookFontFamily = rtl ? 'Cairo' : 'Poppins';
  const storyPages = params.story?.pages && params.story.pages >= 8 ? Math.min(40, params.story.pages) : 8;
  const dims = parseBookDimensionsFromFormat(params.story?.format);

  const rawCover = params.story?.coverImage ? resolveImg(params.story.coverImage) : '';
  const childPhoto = item.childPhotoBase64 || '';
  const storyTitle = item.storyDomain ? `${item.storyTitle} — ${item.storyDomain}` : item.storyTitle;

  const coverHeroLine =
    item.language === 'ar'
      ? `${item.storyTitle}\nبطولة: ${item.childName}`
      : item.language === 'fr'
      ? `${item.storyTitle}\nAvec ${item.childName}`
      : `${item.storyTitle}\nStarring ${item.childName}`;

  const defaultDedication =
    item.language === 'ar'
      ? `إلى ${item.childName} (${item.childAge} سنوات)\nكل صورة تحمل حكاية جميلة لك.`
      : item.language === 'fr'
      ? `Pour ${item.childName} (${item.childAge} ans)\nChaque image raconte une belle histoire.`
      : `For ${item.childName} (Age ${item.childAge})\nEvery picture holds a magical story.`;

  const pages: BookPage[] = Array.from({ length: storyPages + 2 }, () =>
    createDefaultBookPage({ font })
  );

  // Page 0: Front Cover
  pages[0] = createDefaultBookPage({
    img: rawCover || childPhoto,
    text: coverHeroLine,
    x: 8,
    y: 66,
    w: 84,
    size: 6.4,
    font,
    color: '#443B3B',
    bg: '#FFF9F2',
    a: 0.9,
    bold: true,
    textShadow: false,
    radius: 3,
    frameBorder: true,
    showChildBadge: Boolean(childPhoto && rawCover),
    childBadgeCorner: rtl ? 'top-left' : 'top-right',
    childBadgeSize: 24,
  });

  // Page 1: Dedication & Child Portrait
  pages[1] = createDefaultBookPage({
    img: childPhoto,
    text: item.dedication?.trim() || defaultDedication,
    x: 6,
    y: 64,
    w: 88,
    size: 4.8,
    font: rtl ? 'Amiri' : 'Poppins',
    layout: childPhoto ? 'split' : 'over',
    color: '#443B3B',
    bg: '#FFF9F2',
    a: 1,
    bold: true,
    textShadow: false,
    fit: 'cover',
    frameBorder: true,
  });

  // Page 2: Parent Story Idea / Opening Scene if provided
  if (item.storyIdea?.trim() && pages.length > 3) {
    pages[2] = createDefaultBookPage({
      img: params.story?.gallery?.[0] ? resolveImg(params.story.gallery[0]) : '',
      text: item.storyIdea.trim(),
      x: 8,
      y: 35,
      w: 84,
      size: 4.5,
      font,
      color: '#443B3B',
      bg: '#F8E8DC',
      a: 0.92,
      bold: false,
      textShadow: false,
      radius: 3,
      frameBorder: true,
    });
  }

  // Last Page: Back Cover
  pages[pages.length - 1] = createDefaultBookPage({
    text: `My Little Story\n${params.order.orderNumber} · ${item.childName}`,
    x: 8,
    y: 42,
    w: 84,
    size: 4.2,
    font: 'Poppins',
    color: '#443B3B',
    bg: '#F8E8DC',
    a: 0.95,
    bold: true,
    textShadow: false,
    frameBorder: true,
  });

  return {
    id: getOrderProjectKey(params.order.id, params.itemIndex),
    title: storyTitle,
    author: item.childName,
    w: dims.w,
    h: dims.h,
    rtl,
    pages,
    childPhotoAsset: childPhoto,
    linkedOrder: {
      orderId: params.order.id,
      orderNumber: params.order.orderNumber,
      itemIndex: params.itemIndex,
      childName: item.childName,
      childAge: item.childAge,
      language: item.language,
      storyId: item.storyId,
      storyTitle: item.storyTitle,
      storyDomain: item.storyDomain,
      storyIdea: item.storyIdea,
      dedication: item.dedication,
      childPhotoBase64: childPhoto,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function padPagesForBooklet(pages: BookPage[]): Array<BookPage | null> {
  if (pages.length < 2) return [...pages];
  const copy: Array<BookPage | null> = [...pages];
  const backCover = copy.pop() ?? null;
  while ((copy.length + 1) % 4 !== 0) {
    copy.push(null);
  }
  copy.push(backCover);
  return copy;
}

export interface ImpositionSheet {
  sheetNumber: number;
  front: [number, number];
  back: [number, number];
}

export function buildBookletImpositionSheets(
  totalPaddedPages: number,
  rtl: boolean
): ImpositionSheet[] {
  const sheets: ImpositionSheet[] = [];
  const totalSheets = Math.floor(totalPaddedPages / 4);
  for (let s = 0; s < totalSheets; s += 1) {
    const front: [number, number] = [totalPaddedPages - 1 - 2 * s, 2 * s];
    const back: [number, number] = [2 * s + 1, totalPaddedPages - 2 - 2 * s];
    if (rtl) {
      front.reverse();
      back.reverse();
    }
    sheets.push({
      sheetNumber: s + 1,
      front,
      back,
    });
  }
  return sheets;
}

export function addPageToProject(
  project: StoryBookProject,
  afterIndex: number
): { project: StoryBookProject; nextIndex: number } {
  if (project.pages.length >= 62) {
    return { project, nextIndex: afterIndex };
  }
  const safeInsertIndex = Math.min(
    Math.max(1, afterIndex + 1),
    project.pages.length - 1
  );
  const template = project.pages[Math.min(afterIndex, project.pages.length - 2)] || project.pages[0];
  const blank = createDefaultBookPage({
    font: template.font,
    color: template.color,
    bg: template.bg,
    a: template.a,
    layout: template.layout,
    fit: template.fit,
    bold: template.bold,
    textShadow: template.textShadow,
    radius: template.radius,
    frameBorder: template.frameBorder,
  });
  const nextPages = [
    ...project.pages.slice(0, safeInsertIndex),
    blank,
    ...project.pages.slice(safeInsertIndex),
  ];
  return {
    project: { ...project, pages: nextPages, updatedAt: new Date().toISOString() },
    nextIndex: safeInsertIndex,
  };
}

export function duplicatePageInProject(
  project: StoryBookProject,
  index: number
): { project: StoryBookProject; nextIndex: number } {
  if (project.pages.length >= 62 || index <= 0 || index >= project.pages.length - 1) {
    return { project, nextIndex: index };
  }
  const source = project.pages[index];
  const copy: BookPage = { ...source, id: createPageId() };
  const nextPages = [
    ...project.pages.slice(0, index + 1),
    copy,
    ...project.pages.slice(index + 1),
  ];
  return {
    project: { ...project, pages: nextPages, updatedAt: new Date().toISOString() },
    nextIndex: index + 1,
  };
}

export function deletePageFromProject(
  project: StoryBookProject,
  index: number
): { project: StoryBookProject; nextIndex: number } {
  // Never delete Front Cover (0) or Back Cover (last), and keep at least 1 content page
  if (project.pages.length <= 3 || index <= 0 || index >= project.pages.length - 1) {
    return { project, nextIndex: index };
  }
  const nextPages = project.pages.filter((_, i) => i !== index);
  const nextIndex = Math.min(index, nextPages.length - 2);
  return {
    project: { ...project, pages: nextPages, updatedAt: new Date().toISOString() },
    nextIndex,
  };
}

export function moveContentPage(
  project: StoryBookProject,
  index: number,
  direction: -1 | 1
): { project: StoryBookProject; nextIndex: number } {
  const target = index + direction;
  if (
    index <= 0 ||
    index >= project.pages.length - 1 ||
    target <= 0 ||
    target >= project.pages.length - 1
  ) {
    return { project, nextIndex: index };
  }
  const nextPages = [...project.pages];
  const tmp = nextPages[index];
  nextPages[index] = nextPages[target];
  nextPages[target] = tmp;
  return {
    project: { ...project, pages: nextPages, updatedAt: new Date().toISOString() },
    nextIndex: target,
  };
}

const STYLE_KEYS: Array<keyof BookPage> = [
  'font',
  'size',
  'lineHeight',
  'w',
  'color',
  'bg',
  'a',
  'al',
  'fit',
  'bold',
  'textShadow',
  'radius',
  'layout',
  'frameBorder',
];

export function applyStyleToAllPages(
  project: StoryBookProject,
  sourceIndex: number,
  scope: 'all' | 'content'
): StoryBookProject {
  const source = project.pages[sourceIndex];
  if (!source) return project;
  const nextPages = project.pages.map((page, idx) => {
    if (scope === 'content' && (idx === 0 || idx === project.pages.length - 1)) {
      return page;
    }
    const updated: BookPage = { ...page };
    for (const key of STYLE_KEYS) {
      (updated as unknown as Record<string, unknown>)[key] = source[key];
    }
    return updated;
  });
  return {
    ...project,
    pages: nextPages,
    updatedAt: new Date().toISOString(),
  };
}

export function hexToRgbString(hex: string): string {
  const clean = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000';
  const r = parseInt(clean.slice(1, 3), 16);
  const g = parseInt(clean.slice(3, 5), 16);
  const b = parseInt(clean.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderBookPageHtml(
  page: BookPage | null,
  options: {
    rtl: boolean;
    childPhotoAsset?: string;
    resolveImageUrl?: (src: string) => string;
  }
): string {
  if (!page) {
    return '<div style="width:100%;height:100%;background:#ffffff;"></div>';
  }
  const split = page.layout === 'split';
  const rgb = hexToRgbString(page.bg);
  const resolveImg = options.resolveImageUrl || ((s: string) => s);
  const resolvedImg = page.img ? resolveImg(page.img) : '';
  const imgStyle = `position:absolute;left:0;top:0;width:100%;height:${
    split ? '62%' : '100%'
  };object-fit:${page.fit};object-position:${page.imgPosX}% ${page.imgPosY}%;transform:scale(${
    page.imgZoom
  });transform-origin:${page.imgPosX}% ${page.imgPosY}%;`;

  const imgHtml = resolvedImg ? `<img src="${escapeHtml(resolvedImg)}" alt="" style="${imgStyle}" />` : '';

  const badgeHtml =
    page.showChildBadge && options.childPhotoAsset
      ? (() => {
          const posStyle =
            page.childBadgeCorner === 'top-left'
              ? 'top:5%;left:5%;'
              : page.childBadgeCorner === 'top-right'
              ? 'top:5%;right:5%;'
              : 'bottom:6%;left:50%;transform:translateX(-50%);';
          return `<div style="position:absolute;${posStyle}width:${page.childBadgeSize}%;aspect-ratio:1/1;border-radius:9999px;overflow:hidden;border:0.7cqw solid #FFF9F2;box-shadow:0 4px 12px rgba(0,0,0,0.22);background:#F8E8DC;"><img src="${escapeHtml(
            options.childPhotoAsset
          )}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>`;
        })()
      : '';

  const frameHtml = page.frameBorder
    ? '<div style="position:absolute;inset:3%;border:0.35cqw solid rgba(68,59,59,0.28);border-radius:2cqw;pointer-events:none;"></div>'
    : '';

  const textHtml = page.text
    ? `<div style="position:absolute;white-space:pre-wrap;direction:${
        options.rtl ? 'rtl' : 'ltr'
      };padding:2.2cqw;overflow-wrap:anywhere;left:${split ? 4 : page.x}%;top:${
        split ? 64 : page.y
      }%;width:${split ? 92 : page.w}%;font-family:'${escapeHtml(
        page.font
      )}',sans-serif;font-weight:${page.bold ? 700 : 400};font-size:${
        page.size
      }cqw;line-height:${page.lineHeight};color:${escapeHtml(
        page.color
      )};text-align:${page.al};border-radius:${page.radius}cqw;background:${
        split ? 'none' : `rgba(${rgb},${page.a})`
      };${page.textShadow && !split ? 'text-shadow:0 1px 4px rgba(0,0,0,0.45);' : ''}">${escapeHtml(
        page.text
      )}</div>`
    : '';

  return `<div style="position:relative;overflow:hidden;container-type:size;width:100%;height:100%;background:${
    split ? escapeHtml(page.bg) : '#ffffff'
  };">${imgHtml}${frameHtml}${badgeHtml}${textHtml}</div>`;
}

export function parseBookProjectJson(rawJson: string): StoryBookProject | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<StoryBookProject>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.pages) || parsed.pages.length < 3) {
      return null;
    }
    const pages = parsed.pages.slice(0, 62).map((p) => createDefaultBookPage(p || {}));
    return {
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : `imported_${Date.now()}`,
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'قصة مستوردة',
      author: typeof parsed.author === 'string' ? parsed.author : '',
      w: Number.isFinite(Number(parsed.w)) && Number(parsed.w) >= 60 ? Number(parsed.w) : 148,
      h: Number.isFinite(Number(parsed.h)) && Number(parsed.h) >= 60 ? Number(parsed.h) : 210,
      rtl: Boolean(parsed.rtl ?? true),
      pages,
      childPhotoAsset: typeof parsed.childPhotoAsset === 'string' ? parsed.childPhotoAsset : undefined,
      linkedOrder: parsed.linkedOrder,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
