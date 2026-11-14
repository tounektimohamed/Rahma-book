import { z } from 'zod';

export interface GovernorateOption {
  nameAr: string;
  nameFr: string;
  nameEn: string;
  delegations: string[];
}

export const TUNISIAN_GOVERNORATES: GovernorateOption[] = [
  { nameAr: 'تونس', nameFr: 'Tunis', nameEn: 'Tunis', delegations: ['المرسى', 'قرطاج', 'المدينة', 'باب البحر', 'العمران', 'المنزه', 'باردو', 'الكرم'] },
  { nameAr: 'أريانة', nameFr: 'Ariana', nameEn: 'Ariana', delegations: ['أريانة المدينة', 'سكرة', 'رواد', 'قلعة الأندلس', 'سيدي ثابت', 'المنيهلة'] },
  { nameAr: 'بن عروس', nameFr: 'Ben Arous', nameEn: 'Ben Arous', delegations: ['بن عروس', 'الزهراء', 'رادس', 'حمام الأنف', 'المروج', 'بومهل البساتين', 'فوشانة'] },
  { nameAr: 'منوبة', nameFr: 'Manouba', nameEn: 'Manouba', delegations: ['منوبة', 'وادي الليل', 'دوار هيشر', 'طبربة', 'الجديدة', 'المرناقية'] },
  { nameAr: 'نابل', nameFr: 'Nabeul', nameEn: 'Nabeul', delegations: ['نابل', 'الحمامات', 'قليبية', 'دار شعبان الفهري', 'قربة', 'بني خلاد', 'منزل تميم'] },
  { nameAr: 'بنزرت', nameFr: 'Bizerte', nameEn: 'Bizerte', delegations: ['بنزرت الشمالية', 'بنزرت الجنوبية', 'منزل بورقيبة', 'ماطر', 'رأس الجبل', 'غار الملح'] },
  { nameAr: 'سوسة', nameFr: 'Sousse', nameEn: 'Sousse', delegations: ['سوسة جوهرة', 'حمام سوسة', 'أكودة', 'القلعة الكبرى', 'مساكن', 'النفيضة'] },
  { nameAr: 'المنستير', nameFr: 'Monastir', nameEn: 'Monastir', delegations: ['المنستير', 'المكنين', 'قصر هلال', 'جمال', 'الساحلين', 'طبلبة'] },
  { nameAr: 'المهدية', nameFr: 'Mahdia', nameEn: 'Mahdia', delegations: ['المهدية', 'قصور الساف', 'الشابة', 'الجم', 'ملولش'] },
  { nameAr: 'صفاقس', nameFr: 'Sfax', nameEn: 'Sfax', delegations: ['صفاقس المدينة', 'صفاقس الغربية', 'ساقية الزيت', 'ساقية الدائر', 'طينة', 'جبنيانة'] },
  { nameAr: 'القيروان', nameFr: 'Kairouan', nameEn: 'Kairouan', delegations: ['القيروان الشمالية', 'القيروان الجنوبية', 'السبيخة', 'حفوز', 'بوحجلة'] },
  { nameAr: 'قابس', nameFr: 'Gabès', nameEn: 'Gabès', delegations: ['قابس المدينة', 'قابس الجنوبية', 'غنوش', 'مارث', 'الحامة'] },
  { nameAr: 'مدنين', nameFr: 'Médenine', nameEn: 'Medenine', delegations: ['مدنين الشمالية', 'جرجيس', 'جربة حومة السوق', 'جربة ميدون', 'بن قردان'] },
  { nameAr: 'باجة', nameFr: 'Béja', nameEn: 'Beja', delegations: ['باجة الشمالية', 'باجة الجنوبية', 'مجاز الباب', 'تستور', 'نفزة'] },
  { nameAr: 'جندوبة', nameFr: 'Jendouba', nameEn: 'Jendouba', delegations: ['جندوبة', 'طبرقة', 'عين دراهم', 'بوسالم', 'غار الدماء'] },
  { nameAr: 'الكاف', nameFr: 'Le Kef', nameEn: 'Kef', delegations: ['الكاف الشرقية', 'الكاف الغربية', 'الدهماني', 'تاجروين', 'السرس'] },
  { nameAr: 'سليانة', nameFr: 'Siliana', nameEn: 'Siliana', delegations: ['سليانة الشمالية', 'مكثر', 'بوعرادة', 'قعفور'] },
  { nameAr: 'زغوان', nameFr: 'Zaghouan', nameEn: 'Zaghouan', delegations: ['زغوان', 'الفحص', 'الناظور', 'بئر مشارقة'] },
  { nameAr: 'القصرين', nameFr: 'Kasserine', nameEn: 'Kasserine', delegations: ['القصرين الشمالية', 'سبيطلة', 'تالة', 'فريانة'] },
  { nameAr: 'سيدي بوزيد', nameFr: 'Sidi Bouzid', nameEn: 'Sidi Bouzid', delegations: ['سيدي بوزيد الغربية', 'المكناسي', 'الرقاب', 'جلمة'] },
  { nameAr: 'قفصة', nameFr: 'Gafsa', nameEn: 'Gafsa', delegations: ['قفصة الجنوبية', 'المتلوي', 'أم العرائس', 'الرديف'] },
  { nameAr: 'توزر', nameFr: 'Tozeur', nameEn: 'Tozeur', delegations: ['توزر', 'نفطة', 'دقاش', 'تمغزة'] },
  { nameAr: 'قبلي', nameFr: 'Kébili', nameEn: 'Kebili', delegations: ['قبلي الشمالية', 'دوز الشمالية', 'سوق الأحد'] },
  { nameAr: 'تطاوين', nameFr: 'Tataouine', nameEn: 'Tataouine', delegations: ['تطاوين الشمالية', 'غمراسن', 'رمادة', 'الذهيبة'] },
];

export const childInfoSchema = z.object({
  childName: z
    .string()
    .trim()
    .min(2, 'childNameMin')
    .max(60, 'childNameMax'),
  childAge: z
    .number()
    .int()
    .min(0, 'childAgeRange')
    .max(14, 'childAgeRange'),
  language: z.enum(['ar', 'fr', 'en']),
  dedication: z.string().trim().max(300, 'dedicationMax'),
  storyDomain: z.string().trim().max(120),
  storyIdea: z.string().trim().max(1200),
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'fullNameRequired').max(120, 'fullNameMax'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{8}$/, 'phoneInvalid'),
  governorate: z.string().trim().min(2, 'governorateRequired').max(80),
  delegation: z.string().trim().min(2, 'delegationRequired').max(80),
  address: z.string().trim().min(5, 'addressRequired').max(300),
  notes: z.string().trim().max(500),
  confirmedAccurate: z.boolean().refine((v) => v === true, {
    message: 'confirmRequired',
  }),
});

export const adminStorySchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/),
  title: z.string().trim().min(2).max(160),
  titleFr: z.string().trim().max(160),
  titleEn: z.string().trim().max(160),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(10).max(2000),
  descriptionFr: z.string().trim().max(2000),
  descriptionEn: z.string().trim().max(2000),
  category: z.string().trim().min(2).max(80),
  categoryFr: z.string().trim().max(80),
  categoryEn: z.string().trim().max(80),
  coverImage: z.string().trim().min(5).max(220000),
  price: z.number().positive().max(1000),
  pages: z.number().int().min(8).max(200),
  format: z.string().trim().min(2).max(80),
  paperType: z.string().trim().min(2).max(120),
  bindingType: z.string().trim().min(2).max(120),
  ageRange: z.string().trim().min(1).max(40),
  prepTime: z.string().trim().max(80),
  featured: z.boolean(),
  active: z.boolean(),
});

export const adminStorefrontSchema = z.object({
  heroHighlightAr: z.string().trim().max(160),
  heroHighlightFr: z.string().trim().max(160),
  heroHighlightEn: z.string().trim().max(160),
  heroTitleAr: z.string().trim().min(2).max(200),
  heroTitleFr: z.string().trim().max(200),
  heroTitleEn: z.string().trim().max(200),
  heroSubtitleAr: z.string().trim().min(2).max(600),
  heroSubtitleFr: z.string().trim().max(600),
  heroSubtitleEn: z.string().trim().max(600),
  heroCtaPrimaryAr: z.string().trim().max(80),
  heroCtaPrimaryFr: z.string().trim().max(80),
  heroCtaPrimaryEn: z.string().trim().max(80),
  heroCtaSecondaryAr: z.string().trim().max(80),
  heroCtaSecondaryFr: z.string().trim().max(80),
  heroCtaSecondaryEn: z.string().trim().max(80),
  heroImage: z.string().trim().min(5).max(220000),
  featuredTitleAr: z.string().trim().max(160),
  featuredTitleFr: z.string().trim().max(160),
  featuredTitleEn: z.string().trim().max(160),
  featuredSubtitleAr: z.string().trim().max(400),
  featuredSubtitleFr: z.string().trim().max(400),
  featuredSubtitleEn: z.string().trim().max(400),
  domainsTitleAr: z.string().trim().max(180),
  domainsTitleFr: z.string().trim().max(180),
  domainsTitleEn: z.string().trim().max(180),
  domainsSubtitleAr: z.string().trim().max(400),
  domainsSubtitleFr: z.string().trim().max(400),
  domainsSubtitleEn: z.string().trim().max(400),
  customBookPrice: z.number().positive().max(1000).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  contactEmail: z.string().trim().max(160).optional(),
  contactLocation: z.string().trim().max(160).optional(),
  instagramUrl: z.string().trim().max(240).optional(),
  facebookUrl: z.string().trim().max(240).optional(),
});

export type ChildInfoFormValues = z.infer<typeof childInfoSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
export type AdminStoryFormValues = z.infer<typeof adminStorySchema>;
export type AdminStorefrontFormValues = z.infer<typeof adminStorefrontSchema>;
