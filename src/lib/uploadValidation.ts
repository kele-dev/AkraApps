export const ALLOWED_RASTER_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const RASTER_IMAGE_ACCEPT = ALLOWED_RASTER_IMAGE_MIMES.join(',');

export function isAllowedImageMime(mimeType: string): boolean {
  if (!mimeType) return false;
  return (ALLOWED_RASTER_IMAGE_MIMES as readonly string[]).includes(
    mimeType.toLowerCase().trim()
  );
}
