export function extractSupabaseStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/object\/public\/[^/]+\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function extractGoogleDriveFileIdFromUrl(url: string): string | null {
  if (!url) return null;
  const lhMatch = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lhMatch) return lhMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return idMatch ? idMatch[1] : null;
}

/** IDs do Drive não contêm `/`; paths do Supabase neste app usam subpastas (`profile/`, etc.). */
export function looksLikeGoogleDriveFileId(id: string): boolean {
  return !id.includes('/') && /^[a-zA-Z0-9_-]+$/.test(id);
}
