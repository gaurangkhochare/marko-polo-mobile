import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export type AutosaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<unknown>,
  delay = 800,
) {
  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const latest = useRef(value);
  const lastSaved = useRef(value);
  const saveRef = useRef(save);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    while (true) {
      if (inFlight.current) {
        await inFlight.current;
      }

      const snapshot = latest.current;
      if (Object.is(snapshot, lastSaved.current)) {
        setStatus('saved');
        return;
      }

      setStatus('saving');
      const request = (async () => {
        await saveRef.current(snapshot);
        lastSaved.current = snapshot;
      })();
      inFlight.current = request;

      try {
        await request;
      } catch (error) {
        setStatus('error');
        throw error;
      } finally {
        if (inFlight.current === request) {
          inFlight.current = null;
        }
      }

      if (Object.is(latest.current, snapshot)) {
        setStatus('saved');
        return;
      }
    }
  }, []);

  const cancel = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (inFlight.current) {
      await inFlight.current.catch(() => {});
    }

    lastSaved.current = latest.current;
    setStatus('saved');
  }, []);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (Object.is(value, lastSaved.current)) {
      return;
    }

    setStatus('unsaved');
    timer.current = setTimeout(() => {
      void flush().catch(() => {});
    }, delay);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [delay, flush, value]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        void flush().catch(() => {});
      }
    });

    return () => {
      subscription.remove();
      void flush().catch(() => {});
    };
  }, [flush]);

  return { status, flush, cancel };
}
