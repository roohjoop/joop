import { JobPost, CommentItem, ChatThread, NotificationItem } from '../types';

/**
 * قاعدة البيانات الأولية للوظائف
 * تم تنظيف التطبيق بالكامل من جميع الوظائف الوهمية
 * المنصة نظيفة تماماً وجاهزة لربطها واستقبال الـ 20 وظيفة الحقيقية المعتمدة
 */
export const INITIAL_JOBS: JobPost[] = [];

export const INITIAL_COMMENTS: Record<string, CommentItem[]> = {};

export const INITIAL_THREADS: ChatThread[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
