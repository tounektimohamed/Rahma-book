# My Little Story — Every Picture Has a Story

منصة تونسية متخصصة في بيع قصص الأطفال المطبوعة والمخصصة باللغات العربية (RTL) والفرنسية والإنجليزية، مبنية باستخدام React + TypeScript + Vite + Tailwind CSS + Cloud Firestore + Firebase Authentication.

## المتطلبات التقنية
- Node.js 20+
- حساب ومشروع Firebase (Cloud Firestore & Firebase Authentication)

## التثبيت والتشغيل محلياً

1. تثبيت الحزم:
   ```bash
   npm install
   ```

2. إعداد متغيرات البيئة:
   انسخ ملف `.env.example` إلى `.env` وأدخل بيانات مشروع Firebase الخاص بك إذا لم تكن تستخدم `firebase-applet-config.json`:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. تشغيل خادم التطوير:
   ```bash
   npm run dev
   ```

4. تشغيل الاختبارات الوحدوية وفحص الأنواع:
   ```bash
   npx --yes tsx --test src/utils/logic.test.ts src/services/images/ImageService.test.ts
   npm run lint
   npm run build
   ```

## النشر على Firebase Hosting

1. بناء النسخة الإنتاجية:
   ```bash
   npm run build
   ```

2. نشر قواعد الأمان والواجهة عبر Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules,hosting
   ```

## البنية والأمان
- **معالجة الصور (`ImageService`)**: التحقق من الصيغة والحجم (حد أقصى 5 ميغابايت)، القص والتدوير والضغط عبر Canvas API إلى JPEG Base64 صغير الحجم دون طباعته في السجل ودون إرساله لخدمات خارجية.
- **حماية الطلبات والبيانات (`firestore.rules`)**: منع القراءة العامة لمجموعة `orders`، إعادة التحقق من أسعار القصص من Firestore قبل حفظ الطلب، والتحقق من صيغة رقم الهاتف التونسي وبنية العناصر والحجم الأقصى للوثيقة.
