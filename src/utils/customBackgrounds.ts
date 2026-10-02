import { CustomUploadedBackground } from '../types';

const DB_NAME = 'wordsoflife_custom_assets_db';
const STORE_NAME = 'custom_backgrounds';
const DB_VERSION = 1;
const LOCAL_STORAGE_KEY = 'wordsoflife_custom_backgrounds_v1';
const LEGACY_LOCAL_STORAGE_KEY = 'luminaverse_custom_backgrounds_v1';

// Synchronous instant retrieval from LocalStorage
export function getStoredCustomBackgrounds(): CustomUploadedBackground[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to parse custom backgrounds from localStorage:', err);
    return [];
  }
}

// Synchronous save to LocalStorage
export function saveToLocalStorage(items: CustomUploadedBackground[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage quota warning for custom backgrounds:', err);
    // If quota exceeded, keep only newest 10 items
    try {
      const trimmed = items.slice(0, 10);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }
}

// Safe IndexedDB initialization with try/catch to handle iframe restrictions
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        } catch {}
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Process uploaded file keeping crisp full quality (Original Quality mode for PNG/SVG and clean corner designs)
export function compressImageFile(
  file: File,
  maxDim = 1920,
  quality = 0.98,
  originalQuality = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If original quality is requested and it's a PNG or SVG, preserve full lossless quality directly!
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    if (originalQuality && (isPng || isSvg)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const targetDim = originalQuality ? 1920 : maxDim;

        // If image is already within targetDim and file size is reasonable, keep original dataUrl directly for zero re-compression blur!
        if (originalQuality && width <= 1920 && height <= 1920 && file.size < 4 * 1024 * 1024) {
          return resolve(e.target?.result as string);
        }

        if (width > targetDim || height > targetDim) {
          if (width > height) {
            height = Math.round((height * targetDim) / width);
            width = targetDim;
          } else {
            width = Math.round((width * targetDim) / height);
            height = targetDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG format for PNG uploads to preserve crisp edges and alpha!
        if (isPng) {
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/jpeg', originalQuality ? 0.98 : quality));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Fetch shared Community Corner Designs from server storage so ALL users see them
export async function fetchCommunityBackgrounds(): Promise<CustomUploadedBackground[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/community-backgrounds');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        return data.items.map((it: any) => ({
          id: it.id,
          title: it.title,
          url: it.url,
          createdAt: it.createdAt || Date.now()
        }));
      }
    }
  } catch (err) {
    console.warn('Could not fetch community backgrounds from server:', err);
  }
  return [];
}

// Upload custom background directly to server permanent storage (/public/backgrounds/corner-designs/)
export async function uploadBackgroundToServer(
  title: string,
  dataUrl: string,
  filename?: string
): Promise<CustomUploadedBackground | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/api/upload-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        dataUrl,
        filename,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.item) {
        return {
          id: data.item.id,
          title: data.item.title,
          url: data.item.url,
          createdAt: data.item.createdAt || Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('Server upload error, falling back to local storage:', err);
  }
  return null;
}

// Load custom backgrounds (LocalStorage first, then merged with Community & IndexedDB)
export async function getCustomBackgrounds(): Promise<CustomUploadedBackground[]> {
  const localItems = getStoredCustomBackgrounds();

  try {
    // 1. Fetch community shared designs from server storage
    const communityItems = await fetchCommunityBackgrounds();

    // 2. Fetch from IndexedDB
    const db = await openDB();
    let idbList: CustomUploadedBackground[] = [];
    if (db) {
      idbList = await new Promise<CustomUploadedBackground[]>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result || []) as CustomUploadedBackground[]);
          req.onerror = () => resolve([]);
        } catch {
          resolve([]);
        }
      });
    }

    // Merge items from Community, IDB, and LocalStorage by ID
    const map = new Map<string, CustomUploadedBackground>();
    communityItems.forEach((item) => map.set(item.id, item));
    localItems.forEach((item) => map.set(item.id, item));
    idbList.forEach((item) => map.set(item.id, item));

    const merged = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    saveToLocalStorage(merged);
    return merged;
  } catch {
    return localItems;
  }
}

// Save custom background permanently (uploads to server storage + caches locally)
export async function saveCustomBackground(
  item: CustomUploadedBackground,
  file?: File
): Promise<CustomUploadedBackground[]> {
  let finalItem = item;

  // If it's a data URL, upload to permanent server storage so ALL users see it
  if (item.url.startsWith('data:')) {
    const serverSaved = await uploadBackgroundToServer(item.title, item.url, file?.name);
    if (serverSaved) {
      finalItem = serverSaved;
    }
  }

  // 1. Immediately save to LocalStorage
  const current = getStoredCustomBackgrounds();
  const updated = [finalItem, ...current.filter((x) => x.id !== finalItem.id && x.id !== item.id)];
  saveToLocalStorage(updated);

  // 2. Persist to IndexedDB in parallel
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(finalItem);
    }
  } catch (err) {
    console.warn('Could not write custom background to IndexedDB:', err);
  }

  return updated;
}

// Delete custom background
export async function deleteCustomBackground(id: string): Promise<CustomUploadedBackground[]> {
  // 1. Remove from LocalStorage
  const current = getStoredCustomBackgrounds();
  const updated = current.filter((x) => x.id !== id);
  saveToLocalStorage(updated);

  // 2. Remove from IndexedDB
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
    }
  } catch (err) {
    console.warn('Could not delete from IndexedDB:', err);
  }

  return updated;
}
