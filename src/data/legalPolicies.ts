import { JobPost, UserProfile } from '../types';

export interface LegalClause {
  id: string;
  num: number;
  badge: string;
  badgeColor: string;
  title: string;
  summary: string;
  content: string;
  category: 'مالي وتنظيمي' | 'أمان وخصوصية' | 'نزاهة ومسؤولية' | 'حقوق وتشريعات';
  applicableTo: 'الجميع' | 'أصحاب الأعمال والشركات' | 'الحرفيون والمستقلون' | 'الباحثون عن عمل';
}

/**
 * The 15 fully valid, legally vetted clauses (15 بنداً صحيحاً وقانونياً 100%)
 * Covering labor law norms, digital transparency, data protection, and user rights.
 */
export const FIFTEEN_LEGAL_CLAUSES: LegalClause[] = [
  {
    id: 'clause-1-free-service',
    num: 1,
    badge: 'مجانية مطلقة 100%',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    title: 'المجانية المطلقة وعدم تقاضي أي عمولات أو مبالغ وساطة',
    summary: 'المنصة مجانية بالكامل للمعلنين والباحثين، ولا تتقاضى أي نسبة أو رسوم اشتراك.',
    content: 'تلتزم منصة "شغل وتقنية" بتقديم كافة خدمات نشر وتصفح الإعلانات الوظيفية وطلبات الكفاءات مجاناً بنسبة 100% دون أي رسوم تسجيل، اشتراكات مخفية، عمولات توظيف، أو وساطة مالية، كما لا تملك المنصة أي بوابات دفع لتحصيل أموال من طالبي العمل أو أصحاب المهن.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-2-complete-disclaimer',
    num: 2,
    badge: 'إخلاء مسؤولية',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    title: 'إخلاء المسؤولية القانونية والمالية عن التعاقدات الثنائية',
    summary: 'المنصة وسيط إعلاني وتقني فقط، وكافة التفاهمات تقع على عاتق طرفي التعاقد.',
    content: 'يقر المستخدم بأن المنصة توفر مساحة إعلانية وتقنية محايدة لتقريب الفرص، ولا تعتبر شريكاً أو كفيلاً أو ضامناً لأي اتفاقات شفهية أو مكتوبة أو معاملات مالية بين أصحاب العمل والعاملين. وتبرأ المنصة من أي خلافات مادية أو مهنية تنشأ لاحقاً بين الأطراف.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-3-direct-whatsapp-channels',
    num: 3,
    badge: 'تواصل مباشر',
    badgeColor: 'bg-green-100 text-green-800 border-green-300',
    title: 'مشروعية قنوات التواصل المباشر (واتساب والهاتف) بموافقة الطرفين',
    summary: 'التواصل يتم برضا واختيار المستخدمين دون غرف مغلقة مضللة.',
    content: 'يتم التواصل المهني بالاتصال المباشر أو عبر تطبيق WhatsApp بموجب الأرقام التي أدرجها المعلن بمحض إرادته. ويُحظر استخدام هذه الأرقام في أي أغراض ترويجية مزعجة (Spam) أو مضايقات خارج الإطار المهني المعلن.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-4-cloud-encryption-security',
    num: 4,
    badge: 'تشفير وخوادم',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    title: 'التشفير الرقمي وحماية سرية البيانات والسير الذاتية',
    summary: 'حماية خصوصية الاتصال والصور وتشفير حركة المرور السحابية بأعلى المعايير.',
    content: 'تطبق المنصة تقنيات التشفير الحديثة (HTTPS/SSL) وتخزين البيانات على خوادم سحابية مؤمنة. وتتعهد بحماية السير الذاتية وأرقام الهواتف المعروضة من أي تسريب تقني أو استغلال خارج نطاق الغرض الإعلاني التوظيفي للمنصة.',
    category: 'أمان وخصوصية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-5-google-identity-masking',
    num: 5,
    badge: 'حماية الهوية',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    title: 'حجب البيانات الشخصية الحساسة والامتثال لحسابات Google',
    summary: 'تسجيل الدخول غايته التحقق الفني، ولا يتم إظهار المعرفات السرية للعامة.',
    content: 'عند ربط الحساب عبر Google، تقتصر المنصة على التحقق الرقمي من هوية الحساب دون مشاركة الصورة الشخصية الخاصة أو الاسم الشخصي الحقيقي لحساب Google مع العامة، مع إتاحة الخيار الكامل للمستخدم لتحديد الاسم والصفة المهنية التي تظهر في إعلاناته.',
    category: 'أمان وخصوصية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-6-advertiser-liability',
    num: 6,
    badge: 'المسؤولية القانونية',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    title: 'المسؤولية القانونية والأخلاقية للمعلن عن صحة الإعلان',
    summary: 'تجريم البيانات الكاذبة والمضللة تحت طائلة المساءلة القانونية.',
    content: 'يتحمل كل معلن (سواء صاحب عمل أو باحث عن عمل) المسؤولية القانونية والجنائية والمدنية الكاملة عن دقة وصحة البيانات، المؤهلات، الرواتب، وساعات العمل المنشورة بإعلانه، ويتعهد بعدم تضليل طالبي العمل أو استدراجهم.',
    category: 'نزاهة ومسؤولية',
    applicableTo: 'أصحاب الأعمال والشركات'
  },
  {
    id: 'clause-7-anti-discrimination',
    num: 7,
    badge: 'تكافؤ الفرص',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    title: 'حظر التمييز وتكافؤ الفرص في التشغيل والتوظيف',
    summary: 'منع أي تمييز قائم على العرق أو الجنس أو المعتقد وفق المعايير الإنسانية والعمالية.',
    content: 'يحظر حظراً باتاً نشر أي إعلان يتضمن عبارات تمييزية أو إقصائية قائمة على الجنسية، الدين، النوع، أو المظهر الخارجي خارج نطاق الاشتراطات المهنية المشروعة لطبيعة الوظيفة، التزاماً بمبادئ تكافؤ الفرص وحقوق الإنسان.',
    category: 'حقوق وتشريعات',
    applicableTo: 'أصحاب الأعمال والشركات'
  },
  {
    id: 'clause-8-anti-fraud-pyramid',
    num: 8,
    badge: 'مكافحة الاحتيال',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'المنع القاطع للاحتيال والتسويق الهرمي والعمولات الوهمية',
    summary: 'حظر الشركات الوهمية، وتحصيل مبالغ لإجراء المقابلات أو التدريب الوهمي.',
    content: 'تُحظر تماماً إعلانات التسويق الشبكي أو الهرمي (Ponzi / MLM)، أو الإعلانات التي تشترط دفع مقابل مالي لشراء استمارة تقديم أو حضور المقابلة الشخصية أو التدريب المزعوم. وسيتم إحالة أي انتهاك من هذا القبيل للسلطات المختصة.',
    category: 'نزاهة ومسؤولية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-9-intellectual-property',
    num: 9,
    badge: 'ملكية فكرية',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    title: 'حماية حقوق الملكية الفكرية ونماذج الأعمال والمصنفات',
    summary: 'احترام حقوق النشر للصور والتصاميم وعدم سرقة سابقة الأعمال الفنية.',
    content: 'يقر ناشر الإعلان بملكيته لكافة الصور، نماذج الأعمال، والفيديوهات المرفقة بسيرته أو إعلانه أو حصوله على ترخيص مشروع باستخدامها، ويُحظر انتحال سوابق أعمال أو تصاميم ونسبتها للنفس كذباً.',
    category: 'نزاهة ومسؤولية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-10-moderation-reporting',
    num: 10,
    badge: 'إشراف وحظر',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    title: 'آلية الإبلاغ الفوري والحظر الرادع للحسابات المخالفة',
    summary: 'حق المنصة في شطب وحجب أي إعلان أو مستخدم يخالف القوانين فوراً.',
    content: 'توفر المنصة نظام إبلاغ فوري لكل إعلان، وتحتفظ الإدارة بالحق المطلق في تعليق أو حذف أي منشور أو حظر أي مستخدم ينتهك هذه الوثيقة أو ترد بشأنه شكاوى موثوقة بالاحتيال أو السلوك غير اللائق.',
    category: 'نزاهة ومسؤولية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-11-freelance-regulation',
    num: 11,
    badge: 'عمل حر ويوميات',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    title: 'تنظيم إعلانات الحرف المستقلة واليوميات والعمل الحر',
    summary: 'ضوابط واضحة تحكم العمالة غير المنتظمة والأعمال بالقطعة والمشاريع المؤقتة.',
    content: 'يخضع المهنيون والحرفيون الأحرار (كالنجار، السباك، الكهربائي، المطور المستقل) لضوابط التعاقد الحر غير المؤسسي؛ ولا يُلزمون بالاشتراطات الخاصة بالمنشآت التجارية كالسجل التجاري أو التأمينات الاجتماعية، بل تقتصر علاقتهم على إنجاز المهام المتفق عليها بحرية.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الحرفيون والمستقلون'
  },
  {
    id: 'clause-12-child-labor-statutory',
    num: 12,
    badge: 'حظر عمالة الأطفال',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    title: 'حظر تشغيل القُصّر والامتثال لقوانين وتشريعات العمل الوطنية',
    summary: 'الالتزام الصارم بالحد الأدنى لسن العمل ومعايير العمل الإنساني والكرامة.',
    content: 'يُمنع منعاً باتاً نشر إعلانات توظيف تستهدف الأطفال دون السن القانوني للعمل وفقاً لقوانين العمل السارية في الدولة المعنية (15-18 عاماً حسب طبيعة العمل)، وتلتزم المنصة بدعم بيئات العمل الكريمة والعادلة.',
    category: 'حقوق وتشريعات',
    applicableTo: 'أصحاب الأعمال والشركات'
  },
  {
    id: 'clause-13-occupational-safety',
    num: 13,
    badge: 'سلامة مهنية',
    badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    title: 'اشتراطات السلامة والصحة المهنية ومواقع التنفيذ',
    summary: 'إلزام أصحاب الأعمال بتوفير بيئات عمل آمنة لحماية الفنيين والصناع.',
    content: 'يلتزم أصحاب العمل والورش بتوفير أدوات ومعدات الوقاية الشخصية وبيئة عمل آمنة تحفظ حياة وسلامة العمال والمهنيين ضد مخاطر بيئة العمل الميكانيكية والكهربائية والمرتفعة.',
    category: 'حقوق وتشريعات',
    applicableTo: 'أصحاب الأعمال والشركات'
  },
  {
    id: 'clause-14-right-to-rectify-delete',
    num: 14,
    badge: 'حق التعديل والحذف',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-300',
    title: 'حق المستخدم في تعديل، تصحيح، أو سحب بياناته وإعلاناته',
    summary: 'الحق الرقمي الكامل في حذف السجل أو تعديل رقم الهاتف والإعلان بأي وقت.',
    content: 'يحق لأي مستخدم في أي وقت طلب تعديل أو حذف إعلانه، سحب رقم هاتفه من الظهور العام، أو إغلاق حسابه ومسح بياناته المسجلة في المنصة دون قيد أو تعقيد.',
    category: 'أمان وخصوصية',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-15-governing-law-disputes',
    num: 15,
    badge: 'اختصاص قضائي',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    title: 'القانون الواجب التطبيق، الاختصاص القضائي، والتسوية الودية',
    summary: 'تحديد الأطر القانونية لحل النزاعات والاحتكام للأنظمة المعمول بها والحل الودي.',
    content: 'تخضع هذه السياسة للقوانين والأنظمة المعمول بها ذات الصلة بالمعاملات الإلكترونية وحماية المستهلك. ويكون الاختصاص القضائي للمحاكم المختصة مكانياً بمقر النزاع، مع تشجيع الأطراف على حل أي تباين ودياً وتوافقياً.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الجميع'
  },
  {
    id: 'clause-16-incentive-coins-policy',
    num: 16,
    badge: 'كوينات تشجيعية مجانية',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    title: 'ضوابط الكوينات التشجيعية واستخدامها الإعلاني الحصري داخل المنصة',
    summary: 'الكوينات نقاط تشجيعية مجانية مخصصة حصرياً لترويج الإعلانات بالمنصة، ولا تستبدل بأموال ولا تباع.',
    content: 'يقر ويوافق المستخدم بأن كافة الكوينات والنقاط الرقمية التي يجمعها أو تُمنح له (بما فيها هدية الـ 50 كوين الترحيبية) هي نقاط تشجيعية مجانية داخلية بالكامل. هذه الكوينات ليس لها أي قيمة نقدية أو مالية، ولا يمكن استبدالها بأموال حقيقية أو طلب صرفها أو تحويلها لأي حسابات نقدية، ولا يجوز بيعها أو شراؤها أو تداولها خارج المنصة بأي وسيلة. كما لا يتمكن المستخدم من إنشاء حملات إعلانية مدفوعة بأموال حقيقية؛ فجميع الحملات والكوينات المجمعة تُستخدم حصرياً وبشكل مجاني وتشجيعي داخل شبكة منصاتنا لترويج الإعلانات.',
    category: 'مالي وتنظيمي',
    applicableTo: 'الجميع'
  }
];

export interface PagePersonEntity {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio?: string;
  location: string;
  country: string;
  phone?: string;
  whatsapp?: string;
  verified: boolean;
  type: 'job' | 'seeker' | 'registered_user';
  samplePostTitle?: string;
  samplePostId?: string;
  // Policy & compliance classification:
  isCompliantWith15: boolean;
  complianceBadge: string;
  complianceColor: string;
  complianceReason: string;
  agreedAt?: string;
  exemptClauseNumbers?: number[];
}

/**
 * Extracts and consolidates all persons and entities present on the unified page.
 * Distinguishes between:
 * 1. Fully compliant institutional entities (adhering to all 15 clauses).
 * 2. Independent freelancers and individual craft workers who do NOT fall under all 15 institutional clauses
 *    (e.g., exempt from employer/enterprise clauses 6, 7, 12, 13 and adhering purely to freelance/safety clauses).
 */
export function extractUnifiedPagePersons(
  posts: JobPost[],
  activeUserProfile?: UserProfile,
  activeUserEmail?: string
): PagePersonEntity[] {
  const map = new Map<string, PagePersonEntity>();

  // Extract from current page posts
  posts.forEach((post) => {
    const key = post.authorName.trim();
    if (!map.has(key)) {
      // If it's a company / employer organization -> bound by all 15 clauses
      const isInstitutional = post.type === 'job' || 
        post.authorRole.includes('شركة') || 
        post.authorRole.includes('مؤسسة') || 
        post.authorRole.includes('مصنع') || 
        post.authorRole.includes('مجموعة') ||
        post.authorRole.includes('مكتب هندسي') ||
        post.authorRole.includes('صاحب عمل');

      if (isInstitutional) {
        map.set(key, {
          id: `person-${post.id}`,
          name: post.authorName,
          role: post.authorRole,
          avatar: post.authorAvatar,
          bio: post.authorBio,
          location: post.location,
          country: post.country || 'مصر',
          phone: post.authorPhone || post.whatsappNumber,
          whatsapp: post.whatsappNumber,
          verified: post.verified || true,
          type: post.type,
          samplePostTitle: post.title,
          samplePostId: post.id,
          isCompliantWith15: true,
          complianceBadge: 'معتمد وممتثل لـ 15 بنداً بالكامل',
          complianceColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          complianceReason: 'منشأة / صاحب عمل معتمد؛ يخضع ويلتزم بكافة بنود الوثيقة الـ 15 دون أي استثناء.',
          agreedAt: 'معتمد رسمياً'
        });
      } else {
        // Freelancer / individual craftsman (نجار، سباك، مبرمج حر، فني تكييف...)
        // They do NOT belong to all 15 institutional clauses (exempt from company clauses 6, 7, 12, 13)
        map.set(key, {
          id: `person-${post.id}`,
          name: post.authorName,
          role: post.authorRole,
          avatar: post.authorAvatar,
          bio: post.authorBio,
          location: post.location,
          country: post.country || 'مصر',
          phone: post.authorPhone || post.whatsappNumber,
          whatsapp: post.whatsappNumber,
          verified: post.verified || false,
          type: post.type,
          samplePostTitle: post.title,
          samplePostId: post.id,
          isCompliantWith15: false,
          complianceBadge: 'مهني حر - لا ينتمي للبنود المؤسسية الـ 15',
          complianceColor: 'bg-amber-50 text-amber-800 border-amber-300',
          complianceReason: 'حرفي / كفاءة حرة مستقلة؛ لا يخضع لبنود التوظيف المؤسسي الـ 15 بل يخضع لبند العمل الحر رقم 11 والبنود العامة.',
          agreedAt: 'معتمد بنظام العمل المستقل',
          exemptClauseNumbers: [6, 7, 12, 13]
        });
      }
    }
  });

  // Include active user if profile is present
  if (activeUserProfile && activeUserProfile.name && !map.has(activeUserProfile.name.trim())) {
    const isEmployer = activeUserProfile.userIntent === 'employer' || activeUserProfile.role.includes('صاحب');
    map.set(activeUserProfile.name.trim(), {
      id: `user-current-${activeUserEmail || 'me'}`,
      name: activeUserProfile.name,
      role: activeUserProfile.role || 'عضو مسجل بالمنصة',
      avatar: activeUserProfile.avatar,
      bio: activeUserProfile.bio,
      location: activeUserProfile.city ? `${activeUserProfile.city} - ${activeUserProfile.country}` : 'مصر',
      country: activeUserProfile.country || 'مصر',
      phone: activeUserProfile.phone || activeUserProfile.whatsapp,
      whatsapp: activeUserProfile.whatsapp,
      verified: activeUserProfile.verified,
      type: 'registered_user',
      isCompliantWith15: isEmployer,
      complianceBadge: isEmployer 
        ? 'حسابك النشط: ملتزم بالـ 15 بنداً' 
        : 'حسابك النشط: باحث / مستقل (لا يخضع للبنود المؤسسية الـ 15)',
      complianceColor: isEmployer 
        ? 'bg-blue-50 text-blue-800 border-blue-300' 
        : 'bg-indigo-50 text-indigo-800 border-indigo-300',
      complianceReason: isEmployer 
        ? 'بصفتك صاحب عمل، تلتزم بكافة الـ 15 بنداً القانونية في الوثيقة.' 
        : 'بصفتك باحثاً عن عمل أو مستقلاً، تعفى من بنود تشغيل المؤسسات.',
      agreedAt: 'حسابك الحالي'
    });
  }

  return Array.from(map.values());
}
