import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — AniCart` : 'AniCart — Premium Anime Wallpapers';
    return () => { document.title = prev; };
  }, [title]);
}
