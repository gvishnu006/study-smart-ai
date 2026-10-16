"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PersistedState {
  running: boolean;
  base: number;
  startedAt: number | null;
}

const STORAGE_KEY = "sst:timer:v1";

function readStorage(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

/**
 * A persistent stopwatch. Survives page reloads by storing the running
 * timestamps in localStorage, so a focus session isn't lost if the tab closes.
 */
export function useTimer() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const baseRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // restore on mount
  useEffect(() => {
    const saved = readStorage();
    if (saved) {
      baseRef.current = saved.base;
      startedAtRef.current = saved.startedAt;
      setRunning(saved.running);
      if (saved.running && saved.startedAt) {
        setSeconds(saved.base + Math.floor((Date.now() - saved.startedAt) / 1000));
      } else {
        setSeconds(saved.base);
      }
    }
  }, []);

  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        running,
        base: baseRef.current,
        startedAt: startedAtRef.current,
      } satisfies PersistedState)
    );
  }, [running]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 250) {
        last = now;
        if (startedAtRef.current) {
          setSeconds(
            baseRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (startedAtRef.current) {
      baseRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000);
      setSeconds(baseRef.current);
    }
    startedAtRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    baseRef.current = 0;
    startedAtRef.current = null;
    setSeconds(0);
    setRunning(false);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  // persist whenever running state flips
  useEffect(() => {
    persist();
  }, [running, persist]);

  return { seconds, running, start, pause, reset };
}
