// Retain decoded Image objects, not just URLs, so transitions can reuse their pixels.
const decoded = new Map<string, HTMLImageElement>();
const inFlight = new Map<string, Promise<void>>();
export function preloadImage(src: string): Promise<void> {
  if (decoded.has(src)) return Promise.resolve();
  const existing = inFlight.get(src);
  if (existing) return existing;
  if (typeof window === 'undefined') return Promise.resolve();
  const promise = new Promise<void>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => fail(), 20000);
    const fail = () => { window.clearTimeout(timeout); image.onload = null; image.onerror = null; reject(new Error('Изображение не загрузилось')); };
    image.onerror = fail;
    image.onload = async () => {
      try {
        if (typeof image.decode === 'function') await image.decode();
        if (image.naturalWidth === 0) { fail(); return; }
        window.clearTimeout(timeout); image.onload = null; image.onerror = null;
        decoded.set(src, image); resolve();
      } catch { fail(); }
    };
    image.src = src;
  });
  inFlight.set(src, promise);
  void promise.then(() => inFlight.delete(src), () => inFlight.delete(src));
  return promise;
}
export function warmImages(urls: string[]) { for (const src of new Set(urls)) void preloadImage(src).catch(() => undefined); }
