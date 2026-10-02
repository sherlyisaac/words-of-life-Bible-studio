import { CURATED_VERSES } from '../data/verses';
import { Verse } from '../types';
import { getNotificationSchedule, saveNotificationSchedule } from './storage';

export function getTodayVerse(): Verse {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const index = Math.abs(dayOfYear) % CURATED_VERSES.length;
  return CURATED_VERSES[index];
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return await Notification.requestPermission();
}

export function hasNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

export async function sendVersePushNotification(verse: Verse, customTitle?: string): Promise<boolean> {
  const title = customTitle || `Daily Scripture Reminder: ${verse.reference}`;
  const body = `"${verse.text.slice(0, 110)}..." — ${verse.reference} (${verse.translation})`;
  const icon = '/icon.svg';

  // 1. Try via Service Worker if available (standard PWA way)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon,
          badge: '/icon.svg',
          tag: 'daily-verse-reminder',
          data: { url: window.location.origin }
        });
        return true;
      }
    } catch {
      // fallback to standard Notification
    }
  }

  // 2. Standard Notification constructor
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon,
        badge: '/icon.svg'
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (err) {
      console.warn('Direct notification failed:', err);
    }
  }

  return false;
}

let notificationTimer: ReturnType<typeof setTimeout> | null = null;

export function initializeDailyNotificationScheduler(onTrigger?: (verse: Verse) => void): () => void {
  const schedule = getNotificationSchedule();
  if (!schedule.enabled) {
    if (notificationTimer) clearTimeout(notificationTimer);
    return () => {};
  }

  const checkAndSchedule = () => {
    const now = new Date();
    const [targetHour, targetMinute] = schedule.time.split(':').map(Number);

    const nextTrigger = new Date();
    nextTrigger.setHours(targetHour, targetMinute, 0, 0);

    // If today's time has already passed, schedule for tomorrow
    if (nextTrigger.getTime() <= now.getTime()) {
      nextTrigger.setDate(nextTrigger.getDate() + 1);
    }

    const delayMs = nextTrigger.getTime() - now.getTime();

    if (notificationTimer) clearTimeout(notificationTimer);

    notificationTimer = setTimeout(async () => {
      const verse = getTodayVerse();
      const todayStr = new Date().toISOString().slice(0, 10);
      saveNotificationSchedule({
        ...schedule,
        lastSentDate: todayStr
      });

      await sendVersePushNotification(verse);
      if (onTrigger) onTrigger(verse);

      // Reschedule for next day
      checkAndSchedule();
    }, delayMs);
  };

  checkAndSchedule();

  return () => {
    if (notificationTimer) clearTimeout(notificationTimer);
  };
}
