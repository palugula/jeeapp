import { useState, useEffect, useCallback } from 'react';
import { getSubjectChapters, scanSubject } from '../lib/api.js';

export function useSubjectChapters(subject) {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!subject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSubjectChapters(subject);
      setChapters(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    load();
  }, [load]);

  const rescan = useCallback(async () => {
    setLoading(true);
    try {
      await scanSubject(subject);
      await load();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [subject, load]);

  return { chapters, loading, error, reload: load, rescan };
}
