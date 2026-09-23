export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  dialCode: string; // digits only e.g. "20"
  example: string;
}

export const ARAB_COUNTRIES: CountryInfo[] = [
  { name: 'مصر', code: '+20', flag: '🇪🇬', dialCode: '20', example: '01012345678' },
  { name: 'السعودية', code: '+966', flag: '🇸🇦', dialCode: '966', example: '0501234567' },
  { name: 'الإمارات', code: '+971', flag: '🇦🇪', dialCode: '971', example: '0501234567' },
  { name: 'الكويت', code: '+965', flag: '🇰🇼', dialCode: '965', example: '91234567' },
  { name: 'الأردن', code: '+962', flag: '🇯🇴', dialCode: '962', example: '0791234567' },
  { name: 'قطر', code: '+974', flag: '🇶🇦', dialCode: '974', example: '55123456' },
  { name: 'البحرين', code: '+973', flag: '🇧🇭', dialCode: '973', example: '39123456' },
  { name: 'عُمان', code: '+968', flag: '🇴🇲', dialCode: '968', example: '91234567' },
  { name: 'العراق', code: '+964', flag: '🇮🇶', dialCode: '964', example: '07701234567' },
  { name: 'ليبيا', code: '+218', flag: '🇱🇾', dialCode: '218', example: '0911234567' },
  { name: 'السودان', code: '+249', flag: '🇸🇩', dialCode: '249', example: '0912345678' },
  { name: 'الجزائر', code: '+213', flag: '🇩🇿', dialCode: '213', example: '0551234567' },
  { name: 'المغرب', code: '+212', flag: '🇲🇦', dialCode: '212', example: '0612345678' },
  { name: 'تونس', code: '+216', flag: '🇹🇳', dialCode: '216', example: '20123456' },
  { name: 'اليمن', code: '+967', flag: '🇾🇪', dialCode: '967', example: '771234567' },
  { name: 'لبنان', code: '+961', flag: '🇱🇧', dialCode: '961', example: '70123456' },
  { name: 'سوريا', code: '+963', flag: '🇸🇾', dialCode: '963', example: '0944123456' },
  { name: 'فلسطين', code: '+970', flag: '🇵🇸', dialCode: '970', example: '0599123456' },
  { name: 'دولي / أخرى', code: '+', flag: '🌍', dialCode: '', example: '123456789' }
];

/**
 * Detect country info by phone number or input
 */
export function detectCountryFromPhone(input: string): CountryInfo | undefined {
  if (!input) return undefined;
  const digits = input.replace(/[^0-9]/g, '');
  
  // Specific check for Egyptian numbers starting with 010, 011, 012, 015 or 20
  if (digits.startsWith('20') || (/^01[0125]/.test(digits) && digits.length <= 11)) {
    return ARAB_COUNTRIES.find(c => c.name === 'مصر');
  }

  // Match against country dial codes sorted by length descending
  const sorted = [...ARAB_COUNTRIES].filter(c => c.dialCode.length > 0).sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) {
      return c;
    }
  }

  return undefined;
}

/**
 * Builds a valid, direct WhatsApp link from either a URL or a phone number.
 */
export function generateWhatsAppUrl(
  input: string, 
  customCountryCode?: string, 
  prefilledText?: string
): string {
  if (!input) return '';
  const trimmed = input.trim();

  // If already a full URL
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('wa.me/')) {
    return `https://${trimmed}`;
  }

  // Phone number normalization
  let digits = trimmed.replace(/[^0-9]/g, '');

  // Handle leading 00 (e.g. 002010... -> 2010...)
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // Handle Egyptian numbers: if starts with 010, 011, 012, 015, prepend 20
  if (/^01[0125]/.test(digits) && digits.length === 11) {
    digits = '20' + digits.substring(1);
  } else if (customCountryCode && customCountryCode !== '+') {
    const rawCode = customCountryCode.replace(/[^0-9]/g, '');
    if (rawCode && !digits.startsWith(rawCode)) {
      // If local number starts with leading 0 (e.g. 0501234567 for KSA), strip leading 0
      if (digits.startsWith('0') && digits.length > 8) {
        digits = digits.substring(1);
      }
      digits = rawCode + digits;
    }
  }

  const encodedMsg = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : '';
  return `https://wa.me/${digits}${encodedMsg}`;
}

/**
 * Generates an appropriate initial conversation greeting for WhatsApp
 * based on whether the advertiser is offering a job or looking for employment.
 */
export function getDefaultWhatsAppMessage(post: { title: string; type: 'job' | 'seeker'; authorName?: string }): string {
  if (post.type === 'job') {
    // When the advertiser posted a job (seeking an employee)
    return `السلام عليكم ورحمة الله، أنا مهتم بالتقديم على وظيفة: "${post.title}" المعلنة على منصة (شغل وتقنيه). يرجى التكرم بتوضيح تفاصيل وشروط العمل.`;
  } else {
    // When the advertiser is seeking work / offering their skills
    return `السلام عليكم ورحمة الله، بخصوص سيرتكم الذاتية وخبرتكم المعروضة على منصة (شغل وتقنيه) في مجال: "${post.title}"، نود التواصل معكم بخصوص فرصة عمل مناسبة.`;
  }
}
