export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeStorageGet<T>(
  key: string,
  fallback: T,
  storage: Pick<Storage, 'getItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
): T {
  if (!storage) return fallback;
  try {
    return safeJsonParse(storage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

export function safeStorageSet(
  key: string,
  value: unknown,
  storage: Pick<Storage, 'setItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeStorageRemove(
  key: string,
  storage: Pick<Storage, 'removeItem'> | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
): void {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage removal errors in restricted browser contexts
  }
}

export const MAX_PERSISTED_IMAGE_CHARS = 900_000;

export function compressImageFileToDataUrl(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Format hasil pembacaan gambar tidak valid.'));
        return;
      }
      const rawDataUrl = reader.result;
      if (rawDataUrl.length <= MAX_PERSISTED_IMAGE_CHARS || typeof document === 'undefined') {
        resolve(rawDataUrl);
        return;
      }
      const img = new window.Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxDimension / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
