# دليل رفع ونشر منصة "شغل وتقنية" (GitHub & Cloudflare Pages)

تمت تهيئة المشروع بالكامل ليعمل بسلاسة فائقة مع دورة العمل: **GitHub -> Cloudflare Pages -> Firebase Firestore & Auth**.

---

## 1. رفع المشروع إلى GitHub (خطوة بخطوة)

### الخطوة الأولى: تهيئة مستودع Git محلياً
افتح الطرفية (Terminal / Command Prompt) في مجلد المشروع ونفّذ الأوامر التالية:

```bash
# 1. تهيئة مستودع جديد
git init

# 2. إضافة كافة الملفات (ملفات التكوين وقواعد الحماية مهيأة بالكامل)
git add .

# 3. حفظ أول إصدار للمشروع
git commit -m "feat: complete Firebase integration and Cloudflare Pages setup"

# 4. تعيين الفرع الرئيسي
git branch -M main

# 5. ربط المستودع بمستودع GitHub الخاص بك (استبدل الرابط برابط مستودعك)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 6. رفع الكود إلى GitHub
git push -u origin main
```

> **ملاحظة أمان وهيكلية:** ملف `firebase-applet-config.json` وقواعد `firestore.rules` و `wrangler.toml` مشمولة تلقائياً في الرفع، مما يتيح لك ولـ Cloudflare البناء والتشغيل فوراً دون الحاجة لأي إعداد يدوي معقد.

---

## 2. أسماء التوكنات والمتغيرات السرية (GitHub Secrets & Cloudflare Variables)

لكي يعمل الربط الآلي والنشر بسلاسة بين GitHub ومشروعك على Cloudflare Pages (`https://jop.pages.dev/`)، إليك قائمة الأسماء والقيم التي يمكنك إضافتها في:
**GitHub Repository > Settings > Secrets and variables > Actions > New repository secret**:

### أ) توكنات ومعرّفات النشر على Cloudflare Pages & Workers:
1. `CLOUDFLARE_API_TOKEN` (التوكن السري الرئيسي المطلوب استخراجه من Cloudflare):
   - **الاسم الدقيق للتوكن**: `CLOUDFLARE_API_TOKEN`
   - **كيفية استخراجه خطوة بخطوة من Cloudflare**:
     1. افتح لوحة تحكم [Cloudflare Dashboard](https://dash.cloudflare.com).
     2. اضغط على أيقونة حسابك (أعلى اليمين) ثم اختر **My Profile**.
     3. من القائمة الجانبية اختر **API Tokens**.
     4. اضغط على زر **Create Token**.
     5. بجوار قالب **Edit Cloudflare Workers**، اضغط على **Use template**.
     6. في خانة **Account Resources**، اختر حسابك (`fa73541af4fcdd947ab78c12fe990a34`).
     7. في خانة **Zone Resources**، اختر **All zones** أو نطاق `roohpro.com`.
     8. اضغط في الأسفل على **Continue to summary** ثم **Create Token**.
     9. سيظهر لك رمز التوكن السري لمرة واحدة، انسخه وضعه في **GitHub Secrets** تحت الاسم: `CLOUDFLARE_API_TOKEN`.

2. `CLOUDFLARE_ACCOUNT_ID` (معرّف الحساب الخاص بك):
   - **القيمة المعتمدة لمشروعك**: `fa73541af4fcdd947ab78c12fe990a34`
   - تم تثبيتها في `wrangler.toml` و `.env.example` ومربوطة بأسرار GitHub.

3. `CLOUDFLARE_ZONE_ID` (معرّف النطاق الخاص بـ roohpro.com):
   - **القيمة المعتمدة لنطاقك**: `a912416981352b81c89ddd294367967e`
   - تم تثبيتها في `wrangler.toml` و `.env.example` ومربوطة بأسرار GitHub.

4. اسم المشروع على Cloudflare:
   - تم تعيينه تلقائياً في الكود: `jop` ليطابق رابطك: `https://jop.pages.dev/` و `roohpro.com/jop`.

### ب) معرّفات Cloudflare D1 و KV و R2 المربوطة تلقائياً:
- **Cloudflare D1 Database**:
  - `binding`: `DB`
  - `database_name`: `h`
  - `database_id`: `8480585e-443f-4ef9-b4e4-45c941c9dbf1`
- **Cloudflare KV Namespace**:
  - `binding`: `ROOH_KV`
  - `id`: `6d9110610f2c45b09c15d3f2f5dee50a`
- **Cloudflare R2 Bucket**:
  - `binding`: `R2_BUCKET`
  - `bucket_name`: `roohme`
  - `preview_bucket_name`: `roohme`
  - `VITE_CF_R2_BUCKET_NAME`: `roohme`
  - `VITE_CF_R2_PUBLIC_URL`: `https://media.roohpro.com`

---

### ج) متغيرات ومفاتيح Firebase المعتمدة للمشروع:
يمكنك إضافتها إما في **GitHub Secrets** أو داخل **Cloudflare Pages > jop > Settings > Environment variables**:

| اسم المتغير في GitHub / Cloudflare | القيمة المعتمدة لمشروعك | الوظيفة |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDsh3MyPdlGGcly2woFtjkQigfm8CnPvys` | مفتاح الـ API لفايربيز |
| `VITE_FIREBASE_PROJECT_ID` | `gen-lang-client-0028535414` | معرّف مشروع Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `gen-lang-client-0028535414.firebaseapp.com` | نطاق المصادقة والدخول |
| `VITE_FIREBASE_DATABASE_ID` | `ai-studio-65fe2e47-86e3-4f46-8e5a-fb620e6eea4e` | قاعدة بيانات Firestore |
| `VITE_FIREBASE_APP_ID` | `1:54158908506:web:bb22734289e1239488cc63` | معرّف تطبيق الويب |
| `VITE_FIREBASE_STORAGE_BUCKET` | `gen-lang-client-0028535414.firebasestorage.app` | سلة التخزين السحابي |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `54158908506` | معرّف الإرسال السحابي |
| `GEMINI_API_KEY` | المفتاح الخاص بك من Google AI Studio | لتفعيل مزايا الذكاء الاصطناعي |

---

### ج) خطوة هامة لعمل تسجيل الدخول بـ Google على رابط Cloudflare:
لكي يعمل زر **تسجيل الدخول بـ Google (Firebase)** على رابط `https://jop.pages.dev/`:
1. ادخل إلى **Firebase Console** (مشروع `gen-lang-client-0107451639`).
2. انتقل إلى **Authentication** ثم علامة تبويب **Settings**.
3. في قسم **Authorized domains**، انقر على **Add domain**.
4. أضف نطاقك: `jop.pages.dev` وكذلك `roohpro.com`.

---

## 3. ربط المشروع بـ Cloudflare Pages (النشر التلقائي السحابي)

1. ادخل إلى لوحة تحكم [Cloudflare Dashboard](https://dash.cloudflare.com).
2. من القائمة الجانبية، اختر **Workers & Pages**.
3. انقر على **Create application** ثم اختر علامة تبويب **Pages**.
4. اختر **Connect to Git** وحدد حسابك في **GitHub**.
5. اختر المستودع الخاص بالمشروع الذي رفعته للتو.
6. في صفحة إعدادات البناء (**Build settings**)، أدخل البيانات التالية:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: اتركها فارغة (أو `/`)
7. في قسم **Environment variables** (اختياري، المشروع مهيأ للعمل مباشرة عبر `firebase-applet-config.json`):
   - `NODE_VERSION`: `20`
8. اضغط على **Save and Deploy**.

سيبدأ Cloudflare بعملية البناء ونشر التطبيق فوراً وسيزودك برابط مباشر سريع ينتهي بـ `.pages.dev`.

---

## 3. تهيئة مسار الدومين المخصص (`roohpro.com/jop`)

في حال أردت ربط النشر بمسار `roohpro.com/jop`:
- من لوحة Cloudflare Pages > مشروعك > **Custom domains**.
- أضف نطاقك الفرعي (مثل `jop.roohpro.com`) أو فعّل مسار Worker المضمن في `wrangler.toml` المرفق مع المشروع.
- ملف `public/_redirects` و `public/_headers` تم إنشاؤهما خصيصاً لضمان عدم حدوث أي أخطاء 404 عند تحديث الصفحات (SPA Routing Fallback).

---

## 4. وظائف Firebase المفعلة والجاهزة

- **Firestore Database**: مزامنة حية لكافة إعلانات الوظائف وطلبات العمل (`posts`) في الزمن الفعلي.
- **Firebase Authentication**: تسجيل دخول فوري بحساب Google بضغطة زر وتوليد بروفايل معتمد.
- **Support Tickets**: نظام تذاكر ودعم فني معزول بالبريد الإلكتروني للعميل ومتاح للمطور.
- **Comments & Reports**: مناقشات وبلاغات فورية موثقة في قواعد البيانات.
- **قواعد حماية مشددة (firestore.rules)**: حماية على مستوى الحقول والصلاحيات تم نشرها وتأمينها على مشروع Firebase.
