import { useCallback, useEffect, useRef, useState } from 'react';
import { chapterAt, chapters, transitionTime } from '@/lib/chronicle';
import { images } from '@/lib/scene-images';
import { preloadImage, warmImages } from '@/lib/image-preload';
import { locations, openingSession, sessionAt, takeAction, worldImage, type Session, type SessionAction } from '@/lib/world';
function freshSession(): Session {
  const values = new Uint32Array(1); crypto.getRandomValues(values);
  return { story: openingSession.story, world: { ...openingSession.world, seed: values[0] ?? 19377 } };
}
export function useGameSession() {
  const [session, setSession] = useState<Session>(openingSession);
  const [pending, setPending] = useState<Session | null>(null);
  const [displayedAt, setDisplayedAt] = useState(Date.parse(sessionAt(openingSession)));
  const [error, setError] = useState('');
  const lastAction = useRef<SessionAction | null>(null);
  useEffect(() => { setSession(freshSession()); }, []);
  useEffect(() => {
    const upcoming = chapters.slice(session.story.index + 1, session.story.index + 3).map(chapter => images[chapter.image]);
    const adjacent = locations[session.world.place].neighbors.map(place => images[worldImage({ ...session, world: { ...session.world, active: true, place } })]);
    warmImages([images[worldImage(session)], ...upcoming, ...adjacent, ...(chapterAt(session.story).escape ? [images.exit] : [])]);
  }, [session]);
  useEffect(() => {
    if (!pending) return;
    let cancelled = false; let frame = 0;
    const from = Date.parse(sessionAt(session)); const to = Date.parse(sessionAt(pending));
    const isChapter = pending.story.index !== session.story.index;
    const duration = !isChapter || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 2000;
    const animation = new Promise<void>(resolve => {
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
        setDisplayedAt(transitionTime(from, to, progress));
        if (progress < 1) frame = requestAnimationFrame(tick); else resolve();
      };
      frame = requestAnimationFrame(tick);
    });
    void Promise.all([preloadImage(images[worldImage(pending)]), animation]).then(() => {
      if (cancelled) return;
      setSession(pending); setPending(null); setError('');
    }).catch(() => {
      if (cancelled) return;
      cancelled = true; cancelAnimationFrame(frame);
      setDisplayedAt(from); setPending(null); setError('Не удалось загрузить следующий кадр. Твой выбор и припасы не потеряны.');
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [pending, session]);
  const perform = useCallback((action: SessionAction) => {
    if (pending) return;
    const next = takeAction(session, action);
    if (next === session) return;
    lastAction.current = action; setError('');
    if (worldImage(next) !== worldImage(session) || next.story.index !== session.story.index) setPending(next);
    else { setSession(next); setDisplayedAt(Date.parse(sessionAt(next))); }
  }, [session, pending]);
  const restart = () => { const next = freshSession(); setPending(null); setSession(next); setDisplayedAt(Date.parse(sessionAt(next))); setError(''); lastAction.current = null; };
  return { session, pending, displayedAt, error, perform, restart, retry: () => { if (lastAction.current) perform(lastAction.current); } };
}
