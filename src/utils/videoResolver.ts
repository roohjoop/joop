/**
 * Video Resolver Utility
 * 
 * Accurately parses and resolves video links from:
 * 1. YouTube (watch, youtu.be, shorts, embed)
 * 2. Facebook (facebook.com/.../videos, fb.watch, reels)
 * 3. TikTok (tiktok.com/@user/video/id, vt.tiktok.com)
 * 4. Direct HTML5 video (.mp4, .webm, .ogg)
 */

export interface ResolvedVideoInfo {
  platform: 'youtube' | 'facebook' | 'tiktok' | 'html5' | 'unknown';
  embedUrl: string;
  rawUrl: string;
  isValid: boolean;
  title?: string;
}

/**
 * Checks if a URL is a YouTube video
 */
export function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)/i.test(url.trim());
}

/**
 * Extracts YouTube video ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Generates responsive YouTube embed URL
 */
export function getYouTubeEmbedUrl(url: string, isMuted: boolean = false, autoPlay: boolean = true): string {
  const id = extractYouTubeId(url);
  if (!id) return '';
  const muteParam = isMuted ? '1' : '0';
  const autoPlayParam = autoPlay ? '1' : '0';
  return `https://www.youtube.com/embed/${id}?autoplay=${autoPlayParam}&mute=${muteParam}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Checks if a URL is a Facebook video or reel
 */
export function isFacebookVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /facebook\.com\/(?:.*\/videos\/|reel\/|watch\/\?v=|share\/|posts\/|watch)|fb\.watch\/|fb\.me\//i.test(trimmed);
}

/**
 * Generates Facebook responsive video embed URL
 */
export function getFacebookEmbedUrl(url: string, autoPlay: boolean = true, isMuted: boolean = false): string {
  if (!url) return '';
  const encoded = encodeURIComponent(url.trim());
  const autoplayParam = autoPlay ? 'true' : 'false';
  const muteParam = isMuted ? '&mute=1' : '';
  return `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&autoplay=${autoplayParam}&width=500${muteParam}`;
}

/**
 * Checks if a URL is a TikTok video
 */
export function isTikTokVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /tiktok\.com\/(?:@[^\/]+\/video\/(\d+)|v\/(\d+)|t\/|.*)|vm\.tiktok\.com|vt\.tiktok\.com/i.test(trimmed);
}

/**
 * Extracts TikTok video ID if available
 */
export function extractTikTokId(url: string): string | null {
  if (!url) return null;
  const match = url.trim().match(/video\/(\d+)/i) || url.trim().match(/\/v\/(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Generates TikTok responsive embed URL
 */
export function getTikTokEmbedUrl(url: string): string {
  const videoId = extractTikTokId(url);
  if (videoId) {
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  }
  return `https://www.tiktok.com/embed?url=${encodeURIComponent(url.trim())}`;
}

/**
 * Checks if a URL is a direct video file (.mp4, .webm, .ogg)
 */
export function isDirectVideoUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase().split('?')[0];
  return clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.ogg') || clean.endsWith('.mov');
}

/**
 * Master video resolver
 */
export function resolveVideoInfo(url?: string, isMuted: boolean = false, autoPlay: boolean = true): ResolvedVideoInfo {
  if (!url || !url.trim()) {
    return {
      platform: 'unknown',
      embedUrl: '',
      rawUrl: '',
      isValid: false
    };
  }

  const rawUrl = url.trim();

  if (isYouTubeUrl(rawUrl)) {
    const embedUrl = getYouTubeEmbedUrl(rawUrl, isMuted, autoPlay);
    return {
      platform: 'youtube',
      embedUrl,
      rawUrl,
      isValid: Boolean(embedUrl)
    };
  }

  if (isFacebookVideoUrl(rawUrl)) {
    const embedUrl = getFacebookEmbedUrl(rawUrl, autoPlay, isMuted);
    return {
      platform: 'facebook',
      embedUrl,
      rawUrl,
      isValid: true
    };
  }

  if (isTikTokVideoUrl(rawUrl)) {
    const embedUrl = getTikTokEmbedUrl(rawUrl);
    return {
      platform: 'tiktok',
      embedUrl,
      rawUrl,
      isValid: true
    };
  }

  if (isDirectVideoUrl(rawUrl) || rawUrl.startsWith('data:video/') || rawUrl.startsWith('blob:')) {
    return {
      platform: 'html5',
      embedUrl: rawUrl,
      rawUrl,
      isValid: true
    };
  }

  // Fallback: if it's any http/https URL with video keywords, attempt iframe/embed
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return {
      platform: 'html5',
      embedUrl: rawUrl,
      rawUrl,
      isValid: true
    };
  }

  return {
    platform: 'unknown',
    embedUrl: '',
    rawUrl,
    isValid: false
  };
}
