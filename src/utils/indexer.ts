import { JobPost, ListingType } from '../types';

/**
 * Normalizes Arabic text for flexible and intelligent searching.
 * Removes diacritics (tashkeel), unifies alef/yaa/taa marbuta variants.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    // Remove Arabic diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize Alef variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Yaa and Alef Maksura (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Taa Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Persian/Urdu letters if any
    .replace(/ك/g, 'ك')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .trim();
}

/**
 * Intelligent indexing search function that scores matches across
 * title, category, description, location, tags, author, and skills.
 */
export function searchAndFilterListings(
  items: JobPost[],
  query: string,
  selectedType: ListingType
): JobPost[] {
  const normQuery = normalizeArabic(query);
  const queryTokens = normQuery.split(/\s+/).filter(t => t.length > 0);

  return items.filter(item => {
    // 1. Must match active tab type ('job' or 'seeker')
    if (item.type !== selectedType) {
      return false;
    }

    // 2. Query matching (if no query, show all in active tab)
    if (queryTokens.length === 0) {
      return true;
    }

    // Build searchable index text for the item across all freeform fields
    const searchableCorpus = normalizeArabic([
      item.title,
      item.category,
      item.location,
      item.country || '',
      item.countryCode || '',
      item.experience,
      item.salary,
      item.description,
      item.authorName,
      item.authorRole,
      item.workType || '',
      ...(item.tags || [])
    ].join(' '));

    // Every query token must appear in the item corpus
    return queryTokens.every(token => searchableCorpus.includes(token));
  });
}
