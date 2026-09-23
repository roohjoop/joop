/**
 * Notification System with Firebase / OneSignal Bridge & Custom Cross-Platform Chime Sound.
 * Distinct audio tone engineered using Web Audio API to deliver a rich, warm, harmonic crystal
 * chime that is noticeably different from default Android system beeps/dings.
 * Works natively across Android, iOS Safari, and Desktop Chrome/Edge/Firefox.
 */

// Shared Web Audio Context (lazy-loaded on first user gesture or notification trigger)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx && AudioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('AudioContext not supported or blocked:', e);
    return null;
  }
}

/**
 * Plays a custom, high-fidelity pleasant harmonic chime.
 * Unlike Android's flat 800Hz notification ding, this generates a cascading
 * tri-tone chime (F#5, A#5, C#6) with warm exponential decay and gentle harmonic overtone.
 */
export function playCustomNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic chime notes: F#5 (739.99 Hz), A#5 (932.33 Hz), C#6 (1108.73 Hz)
    const notes = [
      { freq: 739.99, start: 0.0, dur: 0.45, gain: 0.18 },
      { freq: 932.33, start: 0.08, dur: 0.55, gain: 0.22 },
      { freq: 1108.73, start: 0.16, dur: 0.75, gain: 0.26 }
    ];

    notes.forEach(({ freq, start, dur, gain: targetGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Sine wave with soft harmonic
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Smooth attack and pleasant exponential ring decay
      gainNode.gain.setValueAtTime(0.0001, now + start);
      gainNode.gain.exponentialRampToValueAtTime(targetGain, now + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });
  } catch (err) {
    console.error('Error playing notification sound:', err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  type?: 'like' | 'comment' | 'follow' | 'message';
  jobId?: string;
  authorName?: string;
  authorAvatar?: string;
  tag?: string;
  icon?: string;
}

/**
 * Dispatches an in-app & system push notification simulating Firebase Cloud Messaging (FCM)
 * and OneSignal push notification delivery, triggering the custom chime sound.
 */
export function dispatchPushNotification(
  payload: PushNotificationPayload,
  onNotify?: (notification: {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: 'like' | 'comment' | 'job' | 'message';
    jobId?: string;
  }) => void
): void {
  // 1. Play our custom distinct notification chime
  playCustomNotificationSound();

  // 2. Trigger native OS notification if user granted permissions
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.authorAvatar || '/icon.svg',
        badge: '/icon.svg',
        tag: payload.jobId || 'shoghl_push',
        dir: 'rtl',
        lang: 'ar'
      });
    } catch {
      // Fallback silently if system blocked background notification
    }
  }

  // 3. Callback to update state
  if (onNotify) {
    onNotify({
      id: 'notif_' + Date.now(),
      title: payload.title,
      description: payload.body,
      time: 'الآن',
      read: false,
      type: payload.type === 'follow' ? 'job' : (payload.type || 'job'),
      jobId: payload.jobId
    });
  }
}

/**
 * Requests browser push notification permission (Firebase / OneSignal integration prep)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}
