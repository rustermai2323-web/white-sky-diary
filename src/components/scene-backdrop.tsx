import { useEffect, useState } from 'react';
interface Props { src: string; alt: string }
export function SceneBackdrop({ src, alt }: Props) {
  const [layers, setLayers] = useState<{ current: string; previous: string | null }>({ current: src, previous: null });
  useEffect(() => {
    setLayers(old => old.current === src ? old : { current: src, previous: old.current });
    const timer = window.setTimeout(() => setLayers(old => ({ ...old, previous: null })), 700);
    return () => window.clearTimeout(timer);
  }, [src]);
  return <>
    <img className="scene-image scene-image-base" src={layers.previous ?? layers.current} alt={layers.previous ? '' : alt} aria-hidden={layers.previous ? true : undefined} fetchPriority="high" />
    {layers.previous && <img key={layers.current} className="scene-image scene-image-enter" src={layers.current} alt={alt} />}
  </>;
}
