import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  generateOrderNumber,
  DELIVERY_FEE_TND,
  FREE_DELIVERY_THRESHOLD_TND,
} from './pricing';
import {
  addItemToCartList,
  updateItemQuantityInList,
  removeItemFromCartList,
  buildCustomizationSignature,
} from './cartLogic';
import { filterAndSortStories } from './catalogFilter';
import {
  adminStorefrontSchema,
  adminStorySchema,
  checkoutSchema,
  childInfoSchema,
} from './validation';
import {
  filterAndSortDomains,
  type StoryDomain,
} from './storyDomains';
import {
  hasConfiguredPassword,
  hashAdminPassword,
  isSingleAuthorizedAdmin,
  verifyAdminPassword,
} from './adminSecurity';
import { resolveStorefrontCopy } from '../types/storefront';
import type { CartItem } from '../types/cart';
import type { Story } from '../types/story';

const samplePhotoA = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgK';
const samplePhotoB = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/ZZZZZZZZZZZZZZZZZZZZZZZZ';

test('pricing calculates subtotal, delivery fee threshold, and total accurately', () => {
  const subtotalBelow = calculateSubtotal([
    { unitPrice: 68, quantity: 1 },
  ]);
  assert.equal(subtotalBelow, 68);
  assert.equal(calculateDeliveryFee(subtotalBelow), DELIVERY_FEE_TND);
  assert.equal(calculateTotal(subtotalBelow, DELIVERY_FEE_TND), 75);

  const subtotalFree = calculateSubtotal([
    { unitPrice: 68, quantity: 2 },
  ]);
  assert.equal(subtotalFree, 136);
  assert.ok(subtotalFree >= FREE_DELIVERY_THRESHOLD_TND);
  assert.equal(calculateDeliveryFee(subtotalFree), 0);
  assert.equal(calculateTotal(subtotalFree, 0), 136);

  assert.equal(calculateDeliveryFee(0), 0);
});

test('generateOrderNumber matches strict MLS-YYMMDD-XXXX pattern', () => {
  const orderNum = generateOrderNumber(new Date('2026-11-13T10:00:00Z'), 'A7K9');
  assert.equal(orderNum, 'MLS-261113-A7K9');
  assert.match(orderNum, /^MLS-[0-9]{6}-[A-Z0-9]{4}$/);
});

test('cart treats same story for two different children as separate items', () => {
  const itemChild1: CartItem = {
    customizationId: 'cust_1',
    storyId: 'story-desert-stars',
    storyTitle: 'سر نجوم الصحراء',
    coverImage: '/cover.jpg',
    childName: 'يوسف',
    childAge: 5,
    language: 'ar',
    dedication: 'إلى بطلي الصغير',
    childPhotoBase64: samplePhotoA,
    unitPrice: 68,
    quantity: 1,
  };

  const itemChild2: CartItem = {
    ...itemChild1,
    customizationId: 'cust_2',
    childName: 'لينا',
    childPhotoBase64: samplePhotoB,
  };

  let cart = addItemToCartList([], itemChild1);
  cart = addItemToCartList(cart, itemChild2);
  assert.equal(cart.length, 2);

  // Adding exact same customization increments quantity instead of duplicating
  cart = addItemToCartList(cart, { ...itemChild1, customizationId: 'cust_3', quantity: 1 });
  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 2);

  // Signature differs when photo differs even for same name
  assert.notEqual(
    buildCustomizationSignature(itemChild1),
    buildCustomizationSignature({ ...itemChild1, childPhotoBase64: samplePhotoB })
  );
});

test('cart quantity update and removal behave deterministically', () => {
  const item: CartItem = {
    customizationId: 'cust_1',
    storyId: 'story-olive-grove',
    storyTitle: 'حكاية غابة الزيتون',
    coverImage: '/cover.jpg',
    childName: 'آدم',
    childAge: 4,
    language: 'fr',
    dedication: '',
    childPhotoBase64: samplePhotoA,
    unitPrice: 64,
    quantity: 1,
  };
  let cart = addItemToCartList([], item);
  cart = updateItemQuantityInList(cart, 'cust_1', 3);
  assert.equal(cart[0].quantity, 3);
  cart = updateItemQuantityInList(cart, 'cust_1', 0);
  assert.equal(cart.length, 0);

  cart = addItemToCartList([], item);
  cart = removeItemFromCartList(cart, 'cust_1');
  assert.equal(cart.length, 0);
});

test('catalog filtering searches across languages, filters category/price, and sorts', () => {
  const stories: Story[] = [
    {
      id: '1',
      title: 'سر نجوم الصحراء',
      titleFr: 'Le Secret des Étoiles',
      titleEn: 'Desert Stars',
      slug: 'desert-stars',
      description: 'Desc 1',
      category: 'مغامرات',
      coverImage: '/1.jpg',
      gallery: [],
      price: 68,
      pages: 28,
      format: '21x25',
      paperType: 'Mat',
      bindingType: 'Hard',
      ageRange: '3-8',
      language: ['ar'],
      featured: true,
      active: true,
    },
    {
      id: '2',
      title: 'حديقة الفوانيس',
      titleEn: 'Lantern Garden',
      slug: 'lantern-garden',
      description: 'Desc 2',
      category: 'ما قبل النوم',
      coverImage: '/2.jpg',
      gallery: [],
      price: 59,
      pages: 24,
      format: '21x21',
      paperType: 'Mat',
      bindingType: 'Hard',
      ageRange: '2-7',
      language: ['ar'],
      featured: false,
      active: true,
    },
  ];

  assert.equal(
    filterAndSortStories(stories, {
      search: 'lantern',
      category: 'all',
      priceRange: 'all',
      sortBy: 'featured',
    }).length,
    1
  );

  const sortedAsc = filterAndSortStories(stories, {
    search: '',
    category: 'all',
    priceRange: 'all',
    sortBy: 'price-asc',
  });
  assert.equal(sortedAsc[0].price, 59);

  const under65 = filterAndSortStories(stories, {
    search: '',
    category: 'all',
    priceRange: 'under-65',
    sortBy: 'featured',
  });
  assert.equal(under65.length, 1);
  assert.equal(under65[0].id, '2');
});

test('Zod schemas enforce Tunisian phone and child info constraints', () => {
  assert.equal(
    childInfoSchema.safeParse({
      childName: 'ياسمين',
      childAge: 5,
      language: 'ar',
      dedication: 'كل الحب لك',
      storyDomain: 'الخيال العلمي والفضاء',
      storyIdea: 'رحلة إلى المريخ مع روبوت ذكي',
    }).success,
    true
  );

  assert.equal(
    childInfoSchema.safeParse({
      childName: 'A',
      childAge: 20,
      language: 'ar',
      dedication: '',
      storyDomain: '',
      storyIdea: '',
    }).success,
    false
  );

  assert.notEqual(
    buildCustomizationSignature({
      storyId: 'story-custom-domain',
      storyDomain: 'الخيال العلمي والفضاء',
      storyIdea: 'رحلة إلى المريخ',
      childName: 'يوسف',
      childAge: 5,
      language: 'ar',
      dedication: '',
      childPhotoBase64: samplePhotoA,
    }),
    buildCustomizationSignature({
      storyId: 'story-custom-domain',
      storyDomain: 'الرياضة وروح الفريق',
      storyIdea: 'بطولة كرة القدم',
      childName: 'يوسف',
      childAge: 5,
      language: 'ar',
      dedication: '',
      childPhotoBase64: samplePhotoA,
    })
  );

  assert.equal(
    checkoutSchema.safeParse({
      fullName: 'أميرة بن علي',
      phone: '22123456',
      governorate: 'تونس',
      delegation: 'المرسى',
      address: 'نهج الحبيب بورقيبة عدد 14',
      notes: '',
      confirmedAccurate: true,
    }).success,
    true
  );

  assert.equal(
    checkoutSchema.safeParse({
      fullName: 'أميرة',
      phone: '1234',
      governorate: 'تونس',
      delegation: 'المرسى',
      address: 'نهج 14',
      confirmedAccurate: false,
    }).success,
    false
  );
});

test('filterAndSortDomains sorts by sortOrder and excludes inactive when requested', () => {
  const customIdeaParse = childInfoSchema.safeParse({
    childName: 'يوسف',
    childAge: 6,
    language: 'ar',
    dedication: 'كل الحب',
    storyDomain: 'رحلة يوسف مع جدته في جربة',
    storyIdea: 'ا'.repeat(900),
  });
  assert.equal(customIdeaParse.success, true);

  const domains: StoryDomain[] = [
    {
      id: 'domain-space',
      label: { ar: 'الخيال العلمي', fr: 'Sci-Fi', en: 'Sci-Fi' },
      summary: { ar: 'مغامرة في الفضاء', fr: 'Espace', en: 'Space' },
      subtopics: { ar: ['المريخ'], fr: ['Mars'], en: ['Mars'] },
      recommendedStoryId: 'custom-freeform',
      coverPreview: '/cover.jpg',
      sortOrder: 20,
      active: false,
    },
    {
      id: 'domain-astro',
      label: { ar: 'الفلك والنجوم', fr: 'Astronomie', en: 'Astronomy' },
      summary: { ar: 'استكشاف السماء', fr: 'Ciel', en: 'Stars' },
      subtopics: { ar: ['تلسكوب'], fr: ['Télescope'], en: ['Telescope'] },
      recommendedStoryId: 'custom-freeform',
      coverPreview: '/cover.jpg',
      sortOrder: 5,
      active: true,
    },
  ];

  const publicList = filterAndSortDomains(domains, false);
  assert.equal(publicList.length, 1);
  assert.equal(publicList[0].id, 'domain-astro');

  const adminList = filterAndSortDomains(domains, true);
  assert.equal(adminList.length, 2);
  assert.equal(adminList[0].id, 'domain-astro');
  assert.equal(adminList[1].id, 'domain-space');
});

test('single-admin email check and Firestore password verification behave securely', async () => {
  assert.equal(await isSingleAuthorizedAdmin('tounekti17@gmail.com', true), true);
  assert.equal(await isSingleAuthorizedAdmin('  TOUNEKTI17@gmail.com ', true), true);
  assert.equal(await isSingleAuthorizedAdmin('tounekti17@gmail.com', false), false);
  assert.equal(await isSingleAuthorizedAdmin('other@gmail.com', true), false);
  assert.equal(await isSingleAuthorizedAdmin(null, true), false);

  assert.equal(hasConfiguredPassword(null), false);
  assert.equal(hasConfiguredPassword({}), false);

  const hashed = await hashAdminPassword('MySecretPass#2026');
  const hashedRecord = {
    passwordHash: hashed.passwordHash,
    salt: hashed.salt,
  };
  assert.equal(hasConfiguredPassword(hashedRecord), true);
  assert.equal(await verifyAdminPassword('MySecretPass#2026', hashedRecord), true);
  assert.equal(await verifyAdminPassword('WrongPass', hashedRecord), false);

  // Direct password set manually in Firestore Console
  const consoleRecord = {
    password: 'ConsoleAdminPassword1',
  };
  assert.equal(hasConfiguredPassword(consoleRecord), true);
  assert.equal(await verifyAdminPassword('ConsoleAdminPassword1', consoleRecord), true);
  assert.equal(await verifyAdminPassword('OtherPassword', consoleRecord), false);
});

test('resolveStorefrontCopy applies Admin overrides with localized fallbacks', () => {
  const defaults = {
    heroHighlight: 'افتراضي',
    heroTitle: 'عنوان افتراضي',
    heroSubtitle: 'وصف افتراضي',
    heroPrimaryCta: 'زر 1',
    heroSecondaryCta: 'زر 2',
    featuredTitle: 'مميزة',
    featuredSubtitle: 'وصف مميز',
    domainsSectionTitle: 'مجالات',
    domainsSectionSubtitle: 'وصف مجالات',
  };

  const resolvedDefault = resolveStorefrontCopy(null, 'ar', defaults);
  assert.equal(resolvedDefault.heroTitle, 'عنوان افتراضي');

  const resolvedOverride = resolveStorefrontCopy(
    {
      heroTitleAr: 'عنوان جديد من الأدمن',
      heroTitleEn: 'Admin Hero Headline',
      heroImage: '/custom-hero.jpg',
    },
    'en',
    defaults
  );
  assert.equal(resolvedOverride.heroTitle, 'Admin Hero Headline');
  assert.equal(resolvedOverride.heroImage, '/custom-hero.jpg');
  assert.equal(resolvedOverride.heroSubtitle, 'وصف افتراضي');
});

test('admin schemas validate story and storefront payloads strictly', () => {
  assert.equal(
    adminStorySchema.safeParse({
      id: 'story-new-1',
      title: 'حكاية القمر',
      titleFr: '',
      titleEn: '',
      slug: 'moon-tale',
      description: 'قصة جميلة وممتعة للأطفال قبل النوم في تونس',
      descriptionFr: '',
      descriptionEn: '',
      category: 'ما قبل النوم',
      categoryFr: '',
      categoryEn: '',
      coverImage: '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
      price: 75,
      pages: 28,
      format: '21 × 25 cm',
      paperType: 'Mat 170g',
      bindingType: 'Hardcover',
      ageRange: '3-8',
      prepTime: '3-4 days',
      featured: true,
      active: true,
    }).success,
    true
  );

  assert.equal(
    adminStorefrontSchema.safeParse({
      heroHighlightAr: 'شريط',
      heroHighlightFr: '',
      heroHighlightEn: '',
      heroTitleAr: 'عنوان متجر معدل',
      heroTitleFr: '',
      heroTitleEn: '',
      heroSubtitleAr: 'وصف معدل من الداشبورد',
      heroSubtitleFr: '',
      heroSubtitleEn: '',
      heroCtaPrimaryAr: 'اكتشف',
      heroCtaPrimaryFr: '',
      heroCtaPrimaryEn: '',
      heroCtaSecondaryAr: 'اصنع',
      heroCtaSecondaryFr: '',
      heroCtaSecondaryEn: '',
      heroImage: '/src/assets/images/hero_storybook_mockup_1794606419841.jpg',
      featuredTitleAr: 'القصص',
      featuredTitleFr: '',
      featuredTitleEn: '',
      featuredSubtitleAr: 'وصف',
      featuredSubtitleFr: '',
      featuredSubtitleEn: '',
      domainsTitleAr: 'الأنواع',
      domainsTitleFr: '',
      domainsTitleEn: '',
      domainsSubtitleAr: 'وصف',
      domainsSubtitleFr: '',
      domainsSubtitleEn: '',
      customBookPrice: 72,
      contactPhone: '+216 20 123 456',
      contactEmail: 'contact@mylittlestory.tn',
      contactLocation: 'تونس',
    }).success,
    true
  );
});
