import { useCallback, useEffect, useState } from 'react';
import { fetchStoryDomains } from '../services/storefront/storefrontService';
import type { StoryDomain } from '../utils/storyDomains';

export function useStoryDomains(includeInactive: boolean = false) {
  const [domains, setDomains] = useState<StoryDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoryDomains(includeInactive);
      setDomains(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LOAD_ERROR');
      setDomains([]);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { domains, loading, error, reload };
}
