const PREFIX = 'img_cache_';

export function cacheEntityImage(entity: string, id: number, dataUrl: string): void {
  if (!id || !dataUrl) return;
  try {
    localStorage.setItem(`${PREFIX}${entity}_${id}`, dataUrl);
  } catch {
    /* localStorage lleno — ignorar */
  }
}

export function getCachedImage(entity: string, id?: number): string {
  if (!id) return '';
  try {
    return localStorage.getItem(`${PREFIX}${entity}_${id}`) || '';
  } catch {
    return '';
  }
}

export function mergeEntityImages<T extends { id?: number; foto?: string }>(
  entity: string,
  items: T[]
): T[] {
  return items.map((item) => ({
    ...item,
    foto: item.foto || getCachedImage(entity, item.id),
  }));
}
