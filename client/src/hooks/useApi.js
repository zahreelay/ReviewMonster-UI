import { useState, useEffect, useCallback } from 'react';

export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}

export function usePolling(fetchFn, interval, shouldPoll = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId;
    let mounted = true;

    async function poll() {
      try {
        const result = await fetchFn();
        if (mounted) {
          setData(result);
          setLoading(false);
          if (shouldPoll) {
            timeoutId = setTimeout(poll, interval);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    poll();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchFn, interval, shouldPoll]);

  return { data, loading, error };
}
