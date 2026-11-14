import { useCallback, useEffect, useState } from 'react';
import { fetchActiveStories } from '../services/stories/storiesService';
import type { Story } from '../types/story';

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveStories();
      setStories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stories, loading, error, reload: load };
}
