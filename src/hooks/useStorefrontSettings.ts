import { useCallback, useEffect, useState } from 'react';
import { fetchStorefrontSettings } from '../services/storefront/storefrontService';
import type { StorefrontSettings } from '../types/storefront';

export function useStorefrontSettings() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStorefrontSettings();
      setSettings(data);
    } catch {
      // Fall back gracefully to default translations
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { settings, loading, reload };
}
