import { useRef, useCallback } from 'react';
import { updateProgress } from '../lib/api.js';

export function useVideoProgress(itemId, onComplete) {
  const lastSavedTime = useRef(0);
  const saveInterval = useRef(null);
  const startTime = useRef(null);

  const startTracking = useCallback((videoEl) => {
    if (!itemId || !videoEl) return;

    startTime.current = Date.now();

    const save = async () => {
      const currentTime = videoEl.currentTime;
      const duration = videoEl.duration;

      if (Math.abs(currentTime - lastSavedTime.current) < 2) return;
      lastSavedTime.current = currentTime;

      try {
        await updateProgress(itemId, {
          currentTime: Math.floor(currentTime),
          duration: isFinite(duration) ? Math.floor(duration) : undefined
        });
      } catch (err) {
        console.warn('Failed to save progress:', err.message);
      }
    };

    saveInterval.current = setInterval(save, 5000);

    const handleEnded = () => {
      save();
      if (onComplete) onComplete();
      stopTracking();
    };

    videoEl.addEventListener('ended', handleEnded);

    return () => {
      videoEl.removeEventListener('ended', handleEnded);
    };
  }, [itemId, onComplete]);

  const stopTracking = useCallback(() => {
    if (saveInterval.current) {
      clearInterval(saveInterval.current);
      saveInterval.current = null;
    }
  }, []);

  return { startTracking, stopTracking };
}
