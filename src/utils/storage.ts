import { DesignProject, NotificationSchedule } from '../types';

const GALLERY_STORAGE_KEY = 'wordsoflife_saved_designs_v1';
const FAVORITES_STORAGE_KEY = 'wordsoflife_favorite_verses_v1';
const NOTIFICATION_STORAGE_KEY = 'wordsoflife_daily_reminder_v1';

export function getSavedDesigns(): DesignProject[] {
  try {
    const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load gallery designs:', err);
    return [];
  }
}

export function saveDesign(project: DesignProject): DesignProject[] {
  try {
    const current = getSavedDesigns();
    const existingIndex = current.findIndex((p) => p.id === project.id);
    let updated: DesignProject[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = project;
    } else {
      updated = [project, ...current];
    }
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save design:', err);
    return getSavedDesigns();
  }
}

export function deleteDesign(id: string): DesignProject[] {
  try {
    const current = getSavedDesigns();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to delete design:', err);
    return getSavedDesigns();
  }
}

export function getFavoriteVerseIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteVerse(verseId: string): string[] {
  try {
    const favorites = getFavoriteVerseIds();
    const exists = favorites.includes(verseId);
    const updated = exists ? favorites.filter((id) => id !== verseId) : [...favorites, verseId];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getNotificationSchedule(): NotificationSchedule {
  try {
    const raw = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    enabled: false,
    time: '08:00'
  };
}

export function saveNotificationSchedule(schedule: NotificationSchedule): void {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(schedule));
  } catch (err) {
    console.warn('Failed to save notification schedule:', err);
  }
}
