import { useEffect } from 'react';

export default function Script({ src, onLoad }: any) {
  useEffect(() => {
    if (!src) return;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (onLoad) onLoad();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    if (onLoad) script.onload = onLoad;
    document.body.appendChild(script);
  }, [src, onLoad]);

  return null;
}
