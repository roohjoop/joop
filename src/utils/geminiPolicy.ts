import { GoogleGenAI } from '@google/genai';
import { FIFTEEN_LEGAL_CLAUSES } from '../data/legalPolicies';

// Pre-computed authoritative legal answers for instant offline/guaranteed availability
const PRECOMPUTED_ANSWERS: Record<string, string> = {
  'diff_independent': `الفرق الجوهري بين الفئتين هو نطاق الالتزام القانوني:
1. الملتزمون بكافة الـ 15 بنداً (أصحاب الأعمال والمؤسسات والشركات):
يلتزمون بكافة اشتراطات السلامة المهنية (البند 13)، حظر تشغيل القُصّر (البند 12)، تكافؤ الفرص وعدم التمييز (البند 7)، والمسؤولية الكاملة عن العقود والرواتب المعلنة.

2. الأشخاص المستقلون والحرفيون (الذين لا ينتمون لبنود المؤسسات الـ 15 الكاملة):
كالنجار والسباك والكهربائي والمبرمج الحر؛ هؤلاء يعملون بصفة ذاتية وحرة ومؤقتة (بموجب البند رقم 11)، وبالتالي يُعفون من القيود والالتزامات الخاصة بالمنشآت التجارية والتأمينات الإلزامية، وتقتصر مسؤوليتهم على أمانة تنفيذ العمل المتفق عليه بالتراضي المباشر.`,

  'free_check': `نعم بكل تأكيد؛ ينص البند الأول (1) بوضوح قاطع على المجانية المطلقة بنسبة 100%. لا تتقاضى المنصة أي عمولة توظيف أو سمسرة أو رسوم اشتراك تحت أي مسمى من أي باحث عن عمل أو صاحب منشأة. ولا تملك المنصة أي حسابات بنكية لتحصيل أموال، والتواصل يتم حراً ومباشراً عبر واتساب والهاتف.`,

  'liability': `تنظم البنود 2 و6 و15 المسؤولية القانونية بدقة:
- المنصة وسيط إعلاني وتقني محايد لا يضمن ولا يكفل أي طرف.
- المعلن (صاحب العمل أو طالب الشغل) يتحمل وحده المسؤولية الجنائية والمدنية عن صحة إعلانه ونزاهة أقواله.
- يمنع البند 8 أي طلبات لتحصيل أموال مقابل المقابلات الشخصية أو التدريب الوهمي.`,

  'whatsapp_security': `تحمي البنود 3 و4 و5 الأطراف عبر:
- التشفير الرقمي السحابي لحماية البيانات.
- حجب البيانات الحساسة لحساب Google وإظهار البيانات المهنية المختارة فقط.
- حظر استخدام أرقام الهواتف أو روابط الواتساب في أي رسائل ترويجية مزعجة أو مضايقات خارج الإطار المهني النزيه.`
};

export async function askGeminiLegalAssistant(userQuery: string): Promise<string> {
  const query = userQuery.trim();

  // Try calling the live Gemini API with gemini-3.8-flash if key is available
  try {
    const apiKey = typeof process !== 'undefined' && process.env?.GEMINI_API_KEY
      ? process.env.GEMINI_API_KEY
      : (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أنت المستشار القانوني الذكي "جيميني" الخاص بمنصة (شغل وتقنية).
إليك قائمة الـ 15 بنداً القانونية المعتمدة 100% في المنصة:
${FIFTEEN_LEGAL_CLAUSES.map(c => `${c.num}. ${c.title}: ${c.summary}`).join('\n')}

لاحظ أن هناك في المنصة فئتان:
1- أصحاب الأعمال والمنشآت: ملتزمون بكافة الـ 15 بنداً بالكامل.
2- المهنيون والحرفيون المستقلون والباحثون الأفراد: لا ينتمون للبنود المؤسسية الـ 15 بالكامل (معفون من بنود المؤسسات مثل 6 و7 و12 و13، ويخضعون لبند العمل الحر 11 والبنود العامة).

سؤال المستخدم: "${query}"
أجب باللغة العربية بأسلوب قانوني مبسط، دقيق، وواضح في فقرة أو فقرتين ملخصتين مع الاستشهاد بأرقام البنود ذات الصلة.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      if (response.text) {
        return response.text.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini API call fallback to precomputed answers:', err);
  }

  // Fallback pattern matching for instant answers
  const lower = query.toLowerCase();
  if (lower.includes('فرق') || lower.includes('مستقل') || lower.includes('لا ينتم') || lower.includes('فئة')) {
    return PRECOMPUTED_ANSWERS['diff_independent'];
  }
  if (lower.includes('مجان') || lower.includes('فلوس') || lower.includes('عمول') || lower.includes('دفع')) {
    return PRECOMPUTED_ANSWERS['free_check'];
  }
  if (lower.includes('مسؤول') || lower.includes('قانون') || lower.includes('احتيال') || lower.includes('نصب')) {
    return PRECOMPUTED_ANSWERS['liability'];
  }
  if (lower.includes('واتساب') || lower.includes('تواصل') || lower.includes('أمان') || lower.includes('تشفير')) {
    return PRECOMPUTED_ANSWERS['whatsapp_security'];
  }

  return `بموجب وثيقة الـ 15 بنداً القانونية المعتمدة 100% في منصة "شغل وتقنية":
توفر المنصة بيئة توظيف مباشرة ومجانية بالكامل (البند 1). يتحمل كل طرف مسؤوليته المباشرة عن الاتفاقات (البند 2 و6). بالنسبة للأشخاص المستقلين والحرفيين، فهم يخضعون لبند العمل الحر (البند 11) ولا ينتمون للالتزامات المؤسسية الخاصة بالشركات، مما يمنحهم المرونة الكاملة للعمل بالقطعة أو اليوميات دون تعقيدات، مع حظر قاطع لأي ممارسات احتيالية (البند 8).`;
}
