import { useCallback, useEffect, useState } from 'react';
import { fetchStoryById } from '../services/stories/storiesService';
import type { Story } from '../types/story';

export function useStoryDetails(storyId: string | undefined) {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storyId) {
      setStory(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStoryById(storyId);
      setStory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LOAD_ERROR');
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { story, loading, error, reload: load };
}
